/* example use

	// create a couple filter expressions
	customerFirstName = eq("FirstName","A*")
	customerCountry = eq("Country","Brazil")
	
	q1 = new DataDiscoveryFilter(customerFirstName)												// create the filter object for the first resource, with an initial filter expression if desired
	q1 = q1.addFilter(customerCountry)															// add the second filter expression, previously stored in a variable
		.addFilter(any("City","Brasília","São Paulo"))											// add another filter expression in-line
		.join("Invoice")																		// join a related resource
		.addFilter( and(gte("InvoiceDate","2011-01-01"), eq("BillingCountry","Brazil") ))		// add a nested filter expression in-line
		.join("InvoiceLine")																	// join a related resource
		.join("Track")																			// join a related resource - last context
		.sort("Name","UnitPrice")																// sort results by these columns
		
	qString = q1.build(true)																	// retrieve the constructed query string
*/

 	// output:
	// FirstName/A*/Country/Brazil/City/Brasília|São Paulo/Invoice/InvoiceDate/2011-01-01../BillingCountry/Brazil/InvoiceLine/Track?sort=Name,UnitPrice&separator=|



// *** expression builders - any/eq/between/gte/lte build expressions

// the default delimiter for any()
let SDB_SEPARATOR = '|SDBSEP|';

// in the highly unlikely event a different separator token is needed
function chgSeparator(value) {
	if (value === undefined) {
		SDB_SEPARATOR = '|SDBSEP|';
		return;
	}

	if (typeof(value) !== 'string') 															{ throw TypeError('Separator must be a string') }
	if (!isNaN(parseInt(value[0])) || value.indexOf(' ') !== -1 || value.indexOf('/') !== -1)	{ throw TypeError('Separator cannot contain spaces/slash') }
	
	SDB_SEPARATOR = value;
}


const SDB_FILTER_ERR_INVALID_COL_NAME = 'Invalid column name argument: must be non-empty string/cannot contain spaces/cannot begin with a number';
const SDB_FILTER_ERR_INVALID_NUM_ARGS = 'Invalid number of filter arguments';
const SDB_FILTER_ERR_INVALID_TYPE = 'Invalid data type for value, must be string or number';
const SDB_FILTER_ERR_EMPTY_STRING = 'String values cannot be empty';
const SDB_FILTER_ERR_INVALID_COMPARE_TYPE ='Range value data types must match';
const SDB_FILTER_ERR_INVALID_RANGE = 'Invalid range values';
const SDB_FILTER_ERR_NO_COL_FOUND = 'No column detected in argument (string must contain at least one of: {col/}';

/**
* Single value filter - give a column name and the value to filter on
*
* eg: eq("CustomerId",1)
*
* @param {String} col - name of column to apply filter to
* @param {String | Number} value - parameter containing the value to filter by
* @returns {String} s - constructed URL fragment for filtering the given column
*/
function eq(col, value) {
	if (arguments.length !== 2) 									{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')									{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }

	if (typeof(value) !== 'number' && typeof(value) !== 'string') {
		throw TypeError(SDB_FILTER_ERR_INVALID_TYPE); 
	}
	
	return any(col, value);
}


/**
* Multi-value filter - give a column name, and a list of n values to filter on
*
* eg: any("CustomerId",1,2,3)
*
* @param {String} col - name of column to apply filter to
* @param {String[] | Number[]} values - rest parameter containing the values to filter by (can be mixed strings/numbers)
* @returns {String} s - constructed URL fragment for filtering the given column
*/
function any(col, ...values) {
	if (arguments.length < 2) 										{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')									{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }

	let s = `${col}/`;
	for (let [i, v] of values.entries()) {
		
		if (typeof(v) !== 'number' && typeof(v) !== 'string') {
			throw TypeError(SDB_FILTER_ERR_INVALID_TYPE + ` (parameter ${i+2})`);
		}		
		
		if (typeof(v) === 'string' && v.trim().length === 0) {
			throw TypeError(SDB_FILTER_ERR_EMPTY_STRING + ` (parameter ${i+2})`); 
			return ''; 
		}
			
		else {
			// if (typeof(v) === 'string') {
				// v = v.replaceAll(',' , '%2C');
			// }

			s += `${v}${SDB_SEPARATOR}`
		}
	}
	
	return s.slice(0, (0 - SDB_SEPARATOR.length) )
}


/**
* Range filter - select a range of values to filter a column on
*
* eg: between("CustomerId",1,10)
*
* @param {String} col - name of column to apply filter to
* @param {String | Number | null} r1 - lower bound value of the range
* @param {String | Number | null} r2 - upper bound value of the range
* @returns {String} s - constructed URL fragment for filtering the given column
*/
function between(col, r1 = null, r2 = null) {

	if (arguments.length < 2 || arguments.length > 3 ) 				{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')									{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }	
	
	// if both values are null/undefined - error
	if ( (r1 || r2) == null) {
		throw ReferenceError(SDB_FILTER_ERR_INVALID_RANGE); 
	}
	
	// if both values are present but are of different types - error
	if ( (r1 && r2) != null ) {
		if ( typeof(r1) !== typeof(r2) ) {
			throw TypeError(SDB_FILTER_ERR_INVALID_COMPARE_TYPE); 
		}
	}
	
	// if either value is an empty string - error
	if ( (typeof(r1) === 'string' && r1.trim().length < 1) || (typeof(r2) === 'string' && r2.trim().length < 1) ) {
		throw TypeError(SDB_FILTER_ERR_EMPTY_STRING); 
	}

	// null values are acceptable as inputs for range values, just need to be converted to empty strings
	r1 = r1 == null ? '' : r1;
	r2 = r2 == null ? '' : r2;

	// now check that each range value, if defined, are valid data types for ranges
	if (typeof(r1) !== 'number' && typeof(r1) !== 'string') { 
		throw TypeError(SDB_FILTER_ERR_INVALID_TYPE); 
	}	
	
	if (typeof(r2) !== 'number' && typeof(r2) !== 'string') { 
		throw TypeError(SDB_FILTER_ERR_INVALID_TYPE); 
	}	

	return `${col}/${r1}..${r2}`
}

/**
* Greater-than-equal filter - select a range of values greater than/equal to filter a column on
*
* eg: gte("CustomerId",10)
*
* @param {String} col - name of column to apply filter to
* @param {String | Number } lb - lower bound value of the filter
* @returns {String} s - constructed URL fragment for filtering the given column
*/

function gte(col, lb) {
	if (arguments.length !== 2) 									{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')									{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }	
	
	if (typeof(lb) !== 'number' && typeof(lb) !== 'string') {
		throw TypeError(SDB_FILTER_ERR_INVALID_TYPE);
	}
	
	if (typeof(lb) === 'string' && lb.trim().length < 1) { 
		throw TypeError(SDB_FILTER_ERR_EMPTY_STRING);
	}
	
	return between(col, lb);
}

/**
* Less-than-equal filter - select a range of values less than/equal to filter a column on
*
* eg: lte("CustomerId",10)
*
* @param {String} col - name of column to apply filter to
* @param {String | Number } ub - upperr bound value of the filter
* @returns {String} s - constructed URL fragment for filtering the given column
*/
function lte(col, ub) {
	if (arguments.length !== 2) 									{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')									{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }	
	
	if (typeof(ub) !== 'number' && typeof(ub) !== 'string') {
		throw TypeError(SDB_FILTER_ERR_INVALID_TYPE);
	}
	
	if (typeof(ub) === 'string' && ub.trim().length < 1) { 
		throw TypeError(SDB_FILTER_ERR_EMPTY_STRING);
	}
	
	return between(col, null, ub);
}


// *** expression modifiers - operate on expressions created by expression builders

/**
* Negates a filter expression - can nest any/eq/and/between/gte/lte expressions
*
* eg: not(eq("CustomerId",1))
*
* @param {String} colFilter - a string containing column filter (can contain concatenated filters)
* @returns {String} s - negated version of URL fragment for filtering the given column(s)
*/
function not(colFilter) { 
	if (arguments.length !== 1) 										{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(colFilter) !== 'string' || colFilter.trim().length < 1) 	{ throw TypeError(SDB_FILTER_ERR_INVALID_TYPE) }
	
	if (colFilter.indexOf('/') === -1) {
		throw SyntaxError(SDB_FILTER_ERR_NO_COL_FOUND);
	}

	return `~${colFilter}`;
}


/**
* Concatenates filter expressions - can nest any/eq/and/between/gte/lte expressions
*
* eg: and( eq("FirstName","David"), any("City","Vancouver","Edmonton") )
*
* @param {String[]} colFilter - an array of strings containing multiple column filters
* @returns {String} s - concatenated URL fragment containing multiple column filters
*/
function and(...colFilters) {

	if (colFilters.length === 0) { throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }

	let s = '';
	for (const [i,v] of colFilters.entries()) {
		if (typeof(v) !== 'string' || v.trim().length < 1) {
			throw TypeError(SDB_FILTER_ERR_INVALID_TYPE + ` (parameter ${i+1})`);
		}		

		if (v.indexOf('/') === -1) {
			throw SyntaxError(SDB_FILTER_ERR_NO_COL_FOUND);
		}

		s += `${v}/`
	}
	return s.slice(0,-1)
}

const SDB_DDF_INVALID_RESOURCE = 'Resource must be a non-empty string/cannot contain spaces/cannot begin with a number/cannot contain "/" character';
const SDB_DDF_INVALID_FILTER = 'Filter must be a non-empty string, must contain at least one "/" character';
const SDB_DDF_INVALID_SORT_COL = 'Column must be a non-empty string/cannot contain spaces/cannot begin with a number';
const SDB_DDF_INVALID_WILDCARD = 'Wildcard must be a string, cannot contain slash (/)';
const SDB_DDF_INVALID_SEPARATOR = 'Separator must be a string, cannot contain slash (/)';
const SDB_DDF_LIMIT_TYPE = 'Limit row number must be a positive integer value';
const SDB_DDF_OFFSET_TYPE = 'Offset row number must be a positive integer value';
const SDB_DDF_DEPTH_TYPE = 'Depth must be a positive integer value';
const SDB_DDF_XSDCARD_TYPE = 'xsdCardinality must be a string or positive integer'

// construct a SlashDB path, for a given HTTP method, with starting resource required, and optional filter for resource
class DataDiscoveryFilter {
	constructor(filter = null, wildcard = '*', separator = ',') {

		if (wildcard !== undefined) {
			if (typeof(wildcard) !== 'string' || wildcard.indexOf('/') !== -1  || wildcard.trim().length < 1) {
				throw TypeError(SDB_DDF_INVALID_WILDCARD);
			}
		}

		if (separator !== undefined || separator !== null) {
			if (typeof(separator) !== 'string' || separator.indexOf('/') !== -1  || separator.trim().length < 1) {
				throw TypeError(SDB_DDF_INVALID_SEPARATOR);
			}

		}		
		
		this.wildcard = wildcard;
		this.separator = separator;
		
		if (filter !== null) {
			if (typeof(filter) !== 'string' || filter.trim().length < 1) {
				throw TypeError(SDB_DDF_INVALID_FILTER);
			}
			if (filter.indexOf('/') === -1) {
				throw SyntaxError(SDB_DDF_INVALID_FILTER);
			}
			filter = filter.replaceAll(SDB_SEPARATOR,this.separator);
		}
		
		this.resources = new Set(['rootResource']);	// track all resources added to the filter
		this.filters = (filter === undefined || filter === null) ? {rootResource : [] } : {rootResource : [filter] };	// track the filter strings for each resource
		this.lastContext = 'rootResource';
		

		
		// will contain any query parameters that are set
		this.queryParams = {
			sort : undefined,
			distinct : false,
			limit: undefined,
			offset: undefined,
			stream : false,
			depth : undefined,
			transpose : false,
			wantarray: false,
			headers: false,
			csvNullStr: false,
			href: false,
			nil_visible: false,
			cardinality: undefined
		};
	
		// the path as it is built up
		this.pathString = '';
		this.pathString += filter == null ? '' : `/${filter}`;
		
		// combines path and query parameters
		this.endpoint = null;
		
		this.build();
	}
	
	// add a filter to current context, accepts strings created using filter expression functions
	addFilter(filterString) {

		if (typeof(filterString) !== 'string' || filterString.trim().length < 1) {
			throw TypeError(SDB_DDF_INVALID_FILTER);
		}
		if (filterString.indexOf('/') === -1) {
			throw SyntaxError(SDB_DDF_INVALID_FILTER);
		}

		filterString = filterString.replaceAll(SDB_SEPARATOR,this.separator);
		
		this.pathString += `/${filterString}`; 
		if (this.filters[this.lastContext] === undefined) {
			this.filters[this.lastContext] = [];
		}
		this.filters[this.lastContext].push(`${filterString}`);
			
		return this.build();
	}

	join(resource) { 
		if (typeof(resource) !== 'string' || resource.trim().length < 1) {
			throw TypeError(SDB_DDF_INVALID_RESOURCE);
		}
		if (resource.indexOf('/') !== -1) {
			throw SyntaxError(SDB_DDF_INVALID_RESOURCE);
		}

		if (!isNaN(parseInt(resource)) || resource.indexOf(' ') !== -1) {
			throw SyntaxError(SDB_DDF_INVALID_RESOURCE);
		}

		this.pathString = `${this.pathString}/${resource}`; 
		this.resources.add(resource);
		this.lastContext = resource;
		return this.build();
	}

	sort(...columns) {
		let s = '';
		if (columns.length < 1) {
			throw TypeError(SDB_DDF_INVALID_SORT_COL);
		}
		
		if (columns.length === 1 && columns[0] === false) {
			this.queryParams['sort'] = undefined;
		}
		
		else {
			for (const col of columns) {

				if (typeof(col) !== 'string' || col.trim().length < 1) {
					throw TypeError(SDB_DDF_INVALID_SORT_COL);
				}
				if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1) {
					throw SyntaxError(SDB_DDF_INVALID_SORT_COL);
				}

				s += `${col},`;
			}
			s = s.slice(0,s.length-1);
			this.queryParams['sort'] = s;
		}
		return this.build();
	}
	
	// helper for sort to mark column sort as descending, exposed as external function desc, not used internally
	_sort_desc(col) {
		
		if (typeof(col) !== 'string') {
			throw TypeError(SDB_DDF_INVALID_SORT_COL);
		}
		if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1) {
			throw SyntaxError(SDB_DDF_INVALID_SORT_COL);
		}

		return `-${col}`;
	}

	// just to have an explicit ascending sort - doesn't do any modifications, exposed as external function asc, not used internally
	_sort_asc(col) {
		
		if (typeof(col) !== 'string') {
			throw TypeError(SDB_DDF_INVALID_SORT_COL);
		}
		if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1) {
			throw SyntaxError(SDB_DDF_INVALID_SORT_COL);
		}

		return `${col}`;
	}	

	distinct(toggle = true) {
		this.queryParams['distinct'] = toggle === true;
		return this.build();
	}

	limit(numRows = false) {
		if (numRows) {
			if ( !Number.isInteger(numRows) || numRows < 1) {
				throw TypeError(SDB_DDF_LIMIT_TYPE);
			}
		}
		this.queryParams['limit'] = numRows !== false ? numRows : undefined;
		return this.build();
	}
	
	offset(numRows = false) {
		if (numRows) {
			if ( !Number.isInteger(numRows) || numRows < 1) {
				throw TypeError(SDB_DDF_OFFSET_TYPE);
			}
		}
		this.queryParams['offset'] = numRows !== false ? numRows : undefined;
		return this.build();
	}

	stream(toggle = true) {
		this.queryParams['stream'] = toggle === true;
		return this.build();
	}

	depth(level = false) {
		if (level) {
			if ( !Number.isInteger(level) || level < 1) {
				throw TypeError(SDB_DDF_DEPTH_TYPE);
			}
		}
		this.queryParams['depth'] = level !== false ? level : undefined;
		return this.build();
	}
		
	transpose(toggle = true) {
		this.queryParams['transpose'] = toggle === true;
		return this.build();
	}
	
	wantarray(toggle = true) {
		this.queryParams['wantarray'] = toggle === true;
		return this.build();
	}
		
	// for CSV data only - will be ignored otherwise 
	csvHeader(toggle = true) {
		this.queryParams['headers'] = toggle === true;
		return this.build();
	}

	csvNullStr(toggle = true) {
		this.queryParams['csvNullStr'] = toggle === true;
		return this.build();
	}

	jsonHref(toggle = true) {
		this.queryParams['href'] = toggle === true;
		return this.build();
	}	

	xmlNilVisible(toggle = true) {
		this.queryParams['nil_visible'] = toggle === true;
		return this.build();
	}	

	xsdCardinality(value = 'unbounded') {

		if (value === false) {
			this.queryParams['cardinality'] = undefined;
		}
		
		else if (value !== 'unbounded') {
			if (typeof(value) === 'string' && value.trim().length < 1) {
				throw TypeError(SDB_DDF_XSDCARD_TYPE);
			}

			else if ( !Number.isInteger(value) || value < 0) {
				throw TypeError(SDB_DDF_XSDCARD_TYPE);
			}


		}
		
		this.queryParams['cardinality'] = value;
		return this.build();
	}	

	// add wildcard to query string - only used internally
	#wildcard() {
		return this.wildcard !== '*' ? `&wildcard=${this.wildcard}` : '';
	}	

	// add separator to query string - only used internally
	#separator() {
		return this.separator !== ',' ? `&separator=${this.separator}` : '' ;
	}
	
	// generate the full filter string
	build() {
		let paramString = '';
		for (const p in this.queryParams) {
			if (this.queryParams[p] !== undefined && this.queryParams[p] !== false) {
				paramString += `${p}=${this.queryParams[p]}&` ;
			}
		}
		paramString = paramString.slice(0,paramString.length-1);	// chop trailing &
		paramString += this.#separator() + this.#wildcard();
		
		this.endpoint = paramString.length > 0 ? `${this.pathString}?${paramString}` : this.pathString;
		
		return this;
	}

	str() {
		return this.endpoint;
	}

}

// break out the _sort_desc function in the datadiscoveryfilter so it can be used standalone
const desc = DataDiscoveryFilter.prototype._sort_desc;
const asc = DataDiscoveryFilter.prototype._sort_asc;

export { chgSeparator }
export { DataDiscoveryFilter, eq, any, between, gte, lte, not, and, desc, asc }

// for testing only
export { SDB_FILTER_ERR_INVALID_COL_NAME, SDB_FILTER_ERR_INVALID_NUM_ARGS, SDB_FILTER_ERR_INVALID_TYPE, SDB_FILTER_ERR_EMPTY_STRING, 
		SDB_FILTER_ERR_INVALID_COMPARE_TYPE, SDB_FILTER_ERR_INVALID_RANGE, SDB_FILTER_ERR_NO_COL_FOUND,
		SDB_DDF_INVALID_RESOURCE, SDB_DDF_INVALID_FILTER, SDB_DDF_INVALID_SORT_COL, SDB_DDF_INVALID_WILDCARD, SDB_DDF_INVALID_SEPARATOR,
		SDB_DDF_LIMIT_TYPE, SDB_DDF_OFFSET_TYPE, SDB_DDF_DEPTH_TYPE, SDB_DDF_XSDCARD_TYPE }
export { SDB_SEPARATOR }