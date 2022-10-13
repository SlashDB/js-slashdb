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
		
	qstring = q1.build(true)																	// retrieve the constructed query string
*/

 	// output:
	// FirstName/A*/Country/Brazil/City/Brasília|São Paulo/Invoice/InvoiceDate/2011-01-01../BillingCountry/Brazil/InvoiceLine/Track?sort=Name,UnitPrice&separator=|


// *** expression builders - any/eq/between/gte/lte build expressions

const SDB_FILTER_ERR_INVALID_COL_NAME = 'Invalid column name parameter: must be non-empty string/cannot contain spaces/cannot begin with a number';
const SDB_FILTER_ERR_INVALID_NUM_ARGS = 'Invalid number of filter parameters';
const SDB_FILTER_ERR_INVALID_TYPE = 'Invalid data type for value, must be string or number';
const SDB_FILTER_ERR_EMPTY_STRING = 'string values cannot be empty';
const SDB_FILTER_ERR_INVALID_COMPARE_TYPE ='Range value data types must match';
const SDB_FILTER_ERR_INVALID_RANGE = 'Invalid range values';
const SDB_FILTER_ERR_NO_COL_FOUND = 'No column detected in parameter (string must contain at least one of: {col/}';

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

/**
* Single value equality filter - column value equals parameter value
*
* eg: eq("CustomerId",1)
*
* @param {string} col - name of column to apply filter to
* @param {string | number} value - parameter containing the value to filter by
* @returns {string} constructed URL fragment for filtering the given column
*/
function eq(col, value) {
	if (arguments.length !== 2) 														{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')														{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1 || col.trim().length < 1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }

	if (typeof(value) !== 'number' && typeof(value) !== 'string') {
		throw TypeError(SDB_FILTER_ERR_INVALID_TYPE); 
	}
	
	return any(col, value);
}


/**
* Multi-value equality filter - column value equals any of the parameter values
*
* eg: any("CustomerId",1,2,3)
*
* @param {string} col - name of column to apply filter to
* @param {...string | ...number} values - comma delimited list of values to filter by (can be mixed strings/numbers)
* @returns {string} constructed URL fragment for filtering the given column
*/
function any(col, ...values) {
	if (arguments.length < 2) 															{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')														{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1 || col.trim().length < 1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }

	let s = `${col}/`;
	for (let [i, v] of values.entries()) {
		
		if (typeof(v) !== 'number' && typeof(v) !== 'string') {
			throw TypeError(SDB_FILTER_ERR_INVALID_TYPE + ` (parameter ${i+2})`);
		}		
		
		/** uncomment to disable empty strings for values **/
		// if (typeof(v) === 'string' && v.trim().length === 0) {
		// 	throw TypeError(SDB_FILTER_ERR_EMPTY_STRING + ` (parameter ${i+2})`); 
		// }
			
		else {
			// if (typeof(v) === 'string') {
				// v = v.replaceAll(',' , '%2C');
			// }

			s += `${v}${SDB_SEPARATOR}`
		}
	}

	// if value was an empty string, then last character in created string will be '/'
	// append '/'
	if (s.endsWith(`/${SDB_SEPARATOR.length}`)) {
		return s.slice(0, (0 - SDB_SEPARATOR.length) ) + '/';
	}
	// if multiple values were given, and final value is an empty string, two separators will
	// present, remove one separator and append '/'
	else if (s.endsWith(`${SDB_SEPARATOR}${SDB_SEPARATOR}`)) {
		return s.slice(0, (0 - SDB_SEPARATOR.length) ) + '/';
	}
	return s.slice(0, (0 - SDB_SEPARATOR.length) )
}


/**
* Range filter - column value is between the parameter values (strictly >< , values not included)
*
* eg: between("CustomerId",1,10)
*
* @param {string} col - name of column to apply filter to
* @param {string | number | null} r1 - lower bound value of the range
* @param {string | number | null} r2 - upper bound value of the range
* @returns {string} constructed URL fragment for filtering the given column
*/
function between(col, r1 = null, r2 = null) {

	if (arguments.length < 2 || arguments.length > 3 ) 									{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')														{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1 || col.trim().length < 1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }	
	
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
* Greater-than-equal filter - column value is greater than the parameter value (strictly >, value not included)
*
* eg: gte("CustomerId",10)
*
* @param {string} col - name of column to apply filter to
* @param {string | number } lb - lower bound value of the filter
* @returns {string} constructed URL fragment for filtering the given column
*/

function gte(col, lb) {
	if (arguments.length !== 2) 														{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')														{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1 || col.trim().length < 1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }	
	
	if (typeof(lb) !== 'number' && typeof(lb) !== 'string') {
		throw TypeError(SDB_FILTER_ERR_INVALID_TYPE);
	}
	
	if (typeof(lb) === 'string' && lb.trim().length < 1) { 
		throw TypeError(SDB_FILTER_ERR_EMPTY_STRING);
	}
	
	return between(col, lb);
}

/**
* Less-than-equal filter - column value is less than the parameter value (strictly <, value not included)
*
* eg: lte("CustomerId",10)
*
* @param {string} col - name of column to apply filter to
* @param {string | number } ub - upperr bound value of the filter
* @returns {string} constructed URL fragment for filtering the given column
*/
function lte(col, ub) {
	if (arguments.length !== 2) 														{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(col) !== 'string')														{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1 || col.trim().length < 1)		{ throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME) }	
	
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
* @param {string} colFilter - a string containing column filter (can contain concatenated filters)
* @returns {string} negated version of URL fragment for filtering the given column(s)
*/
function not(colFilter) { 
	if (arguments.length !== 1)											{ throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS) }
	if (typeof(colFilter) !== 'string' || colFilter.trim().length < 1) 	{ throw TypeError(SDB_FILTER_ERR_INVALID_TYPE) }
	
	if (colFilter.indexOf('/') === -1) {
		throw SyntaxError(SDB_FILTER_ERR_NO_COL_FOUND);
	}

	return `~${colFilter}`;
}


/**
* Concatenates filter expressions - can nest any/eq/between/gte/lte expressions
*
* eg: and( eq("FirstName","David"), any("City","Vancouver","Edmonton") )
*
* @param {...string} colFilters - comma delimited list of strings containing column filters
* @returns {string} concatenated URL fragment containing multiple column filters
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

export { eq, any, between, gte, lte, not, and }
export { chgSeparator }
export { SDB_SEPARATOR }

// for testing only
export { SDB_FILTER_ERR_INVALID_COL_NAME, SDB_FILTER_ERR_INVALID_NUM_ARGS, SDB_FILTER_ERR_INVALID_TYPE, SDB_FILTER_ERR_EMPTY_STRING, 
    SDB_FILTER_ERR_INVALID_COMPARE_TYPE, SDB_FILTER_ERR_INVALID_RANGE, SDB_FILTER_ERR_NO_COL_FOUND }
