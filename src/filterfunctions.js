import { asc, desc } from './basefilter.js';

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
		
	qstring = q1.str()																	// retrieve the constructed query string
*/

 	// output:
	// FirstName/A*/Country/Brazil/City/Brasília|São Paulo/Invoice/InvoiceDate/2011-01-01../BillingCountry/Brazil/InvoiceLine/Track?sort=Name,UnitPrice


// *** expression builders - any/eq/between/gte/lte build expressions

const SDB_FILTER_ERR_INVALID_COL_NAME = "Invalid column name parameter: must be non-empty string/cannot contain spaces/cannot begin with a number/cannot contain '/'";
const SDB_FILTER_ERR_INVALID_NUM_ARGS = 'Invalid number of filter parameters';
const SDB_FILTER_ERR_INVALID_TYPE = 'Invalid data type for value, must be string or number';
const SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING = 'String values cannot be empty';
const SDB_FILTER_ERR_INVALID_VALUE_SLASH = "String values cannot contain '/' (use __ or set placeholder query parameter for values that contain '/') ";
const SDB_FILTER_ERR_INVALID_COMPARE_TYPE ='Range value data types must match';
const SDB_FILTER_ERR_INVALID_RANGE = 'Invalid range values';
const SDB_FILTER_ERR_INVALID_RANGE_VALUE_DOTS = "Range values cannot contain '..'";
const SDB_FILTER_ERR_NO_COL_FOUND = 'No column detected in parameter (string must contain at least one of: {col/}';
const SDB_FILTER_ERR_INVALID_NUM_ARRAY_ELEMENTS = 'Array must contain pairs of ranges (e.g. [1,5,8,10], an even number of values)';

// the default delimiter for any(), between()
let SDB_SEPARATOR = '|SDBSEP|';

// in the highly unlikely event a different separator token is needed
function chgSeparator(value) {
	if (value === undefined) {
		SDB_SEPARATOR = '|SDBSEP|';
		return;
	}

	if (typeof(value) !== 'string') {
		throw TypeError('Separator must be a string') 
	}
	
	if (!isNaN(parseInt(value[0])) || value.indexOf(' ') !== -1 || value.indexOf('/') !== -1) {
		throw TypeError('Separator cannot contain spaces/slash') 
	}
	
	SDB_SEPARATOR = value;
}

// sanity checks for column names
function validateColumnName(col) {
	if (typeof(col) !== 'string') {
		throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME);
	}
	
	if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1 || col.trim().length < 1) {
		throw TypeError(SDB_FILTER_ERR_INVALID_COL_NAME);
	}
	
	if (col.indexOf('/') !== -1) {								
		throw SyntaxError(SDB_FILTER_ERR_INVALID_COL_NAME);
	}
	
	return
}


/**
* Single value equality filter - column value equals parameter value
*
* eg: eq("CustomerId",1)
*
* @param {string} col - name of column to apply filter to
* @param {string | number} value - parameter containing the value to filter by
* @returns {string} constructed URL segment for filtering the given column
*/
function eq(col, value) {
	if (arguments.length !== 2) {
		throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
	}
	validateColumnName(col);

	if (typeof(value) !== 'number' && typeof(value) !== 'string') {
		throw TypeError(SDB_FILTER_ERR_INVALID_TYPE); 
	}

	if (typeof(value) === 'string' && value.indexOf('/') !== -1) {
		throw SyntaxError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);
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
* @returns {string} constructed URL segment for filtering the given column
*/
function any(col, ...values) {
	if (arguments.length < 2) {
		throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
	}
	validateColumnName(col);

	let s = `${col}/`;
	for (let [i, v] of values.entries()) {
		
		if (typeof(v) !== 'number' && typeof(v) !== 'string') {
			throw TypeError(SDB_FILTER_ERR_INVALID_TYPE + ` (parameter ${i+2})`);
		}		

		if (typeof(v) === 'string' && v.indexOf('/') !== -1) {
			throw SyntaxError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);
		}	
			
		/** uncomment to disable empty strings for values **/
		// if (typeof(v) === 'string' && v.trim().length === 0) {
		// 	throw TypeError(SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING + ` (parameter ${i+2})`); 
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
* Range filter - column value is between the parameter values
*
* eg: 
* between("CustomerId",1,10) - returns range string with column name
* between([4,8,10,12]) - returns string w/o column name with multiple ranges separated by separtor
*
* @param {string} arg1 - name of column to apply filter to, or array of values
* @param {string | number | null} r1 - lower bound value of the range
* @param {string | number | null} r2 - upper bound value of the range
* @returns {string} constructed URL segment for filtering the given column, or range string separated by separator
*/
function between(arg1, r1 = null, r2 = null) {

	let hasColumnName = false;
	let rangeValues = [];
	let s = '';

	if (arguments.length < 1 || arguments.length > 3 ) { 
		throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
	}
	
	if (arguments.length == 1) {
		if (! Array.isArray(arg1)) {
			throw SyntaxError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
		}
		rangeValues = arg1;

		if (rangeValues.length % 2 !== 0 || rangeValues.length === 0) {
			throw RangeError(SDB_FILTER_ERR_INVALID_NUM_ARRAY_ELEMENTS);
		}
	}

	// when 2+ args are present, arg1 is column name, validate
	else if (arguments.length >= 2) {
		validateColumnName(arg1);
		hasColumnName = true;
		rangeValues = [r1, r2];
	}

	// group values in the rangeValue array into array of pairs
	rangeValues = rangeValues.reduce( (result, value, i, array) => {
		if (i % 2 === 0) {
			result.push(array.slice(i, i+2));
		}
		return result;
	}, []);

	for (let [v1,v2] of rangeValues)
	{
		// if both values are null/undefined - error
		if ( (v1 === null || v1 === undefined) && (v2 === null || v2 === undefined) ) {
			throw ReferenceError(SDB_FILTER_ERR_INVALID_RANGE); 
		}
		
		// if both values are present but are of different types - error
		if ((v1 !== null && v1 !== undefined) && (v2 !== null && v2 !== undefined) ) {
			if ( typeof(v1) !== typeof(v2) ) {
				throw TypeError(SDB_FILTER_ERR_INVALID_COMPARE_TYPE); 
			}
		}
		
		// if either value is an empty string - error
		if ( (typeof(v1) === 'string' && v1.trim().length < 1) || (typeof(v2) === 'string' && v2.trim().length < 1) ) {
			throw TypeError(SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING); 
		}

		// if values contain '/' - error
		if (typeof(v1) === 'string' && v1.indexOf('/') !== -1 || typeof(v2) === 'string' && v2.indexOf('/') !== -1) {
			throw SyntaxError(SDB_FILTER_ERR_INVALID_VALUE_SLASH);
		}	

		// if values contain .. - error
		if (typeof(v1) === 'string' && v1.indexOf('..') !== -1 || typeof(v2) === 'string' && v2.indexOf('..') !== -1) {
			throw SyntaxError(SDB_FILTER_ERR_INVALID_RANGE_VALUE_DOTS);
		}

		// null values are acceptable as inputs for range values, just need to be converted to empty strings
		v1 = v1 == null ? '' : v1;
		v2 = v2 == null ? '' : v2;

		// now check that each range value, if defined, are valid data types for ranges - note that the only strings
		// that can actually be used are date strings
		if (typeof(v1) !== 'number' && typeof(v1) !== 'string') { 
			throw TypeError(SDB_FILTER_ERR_INVALID_TYPE); 
		}	
		
		if (typeof(v2) !== 'number' && typeof(v2) !== 'string') { 
			throw TypeError(SDB_FILTER_ERR_INVALID_TYPE); 
		}	

		// when column name is present, there will only be one pair of values
		if (hasColumnName) {
			s = `${arg1}/${v1}..${v2}`;
			break;
		}

		else {
			s += `${v1}..${v2}${SDB_SEPARATOR}`;
		}
	}
	if (hasColumnName) {
		return s;
	}
	
	return s.slice(0, (0 - SDB_SEPARATOR.length) )
	
}

/**
* Greater-than-equal filter - column value is greater than or equal to the parameter value
* Wrapper for between()
*
* eg: 
* gte("CustomerId",10) - returns range string with column name
* gte(10) - returns range string w/o column
*
* @param {string} arg1 - name of column to apply filter to, or lower bound
* @param {string | number } lb - lower bound value of the filter when column name given
* @returns {string} constructed URL segment for filtering the given column, or bare range string
*/

function gte(arg1, lb) {
	if (arguments.length === 0 || arguments.length > 2) {
		throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
	}

	if (arguments.length == 1) {
		return between([arg1, null]);
	}
	
	return between(arg1, lb, null);

}

/**
* Less-than-equal filter - column value is less than or equal to the parameter value
* Wrapper for between()
*
* eg: 
* lte("CustomerId",10) - returns range string with column name
* lte(10) - returns range string w/o column
*
* @param {string} arg1 - name of column to apply filter to, or upper bound
* @param {string | number } ub - upper bound value of the filter when column name given
* @returns {string} constructed URL segment for filtering the given column, or bare range string
*/

function lte(arg1, ub) {
	if (arguments.length === 0 || arguments.length > 2) {
		throw ReferenceError(SDB_FILTER_ERR_INVALID_NUM_ARGS);
	}

	if (arguments.length == 1) {
		return between([null, arg1]);
	}
	
	return between(arg1, null, ub);
}


// *** expression modifiers - operate on expressions created by expression builders

/**
* Negates a filter expression - can nest any/eq/and/between/gte/lte expressions
*
* eg: not(eq("CustomerId",1))
*
* @param {string} colFilter - a string containing column filter (can contain concatenated filters)
* @returns {string} negated version of URL segment for filtering the given column(s)
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
* @returns {string} concatenated URL segment containing multiple column filters
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

		if (v.endsWith('/')) {
			s += v;
		}
		else {
			s += `${v}/`;
		}
	}
	return s.slice(0,-1)
}

export { eq, any, between, gte, lte, not, and }
export { chgSeparator }
export { asc, desc }
export { SDB_SEPARATOR }

// for testing only
export { SDB_FILTER_ERR_INVALID_COL_NAME, SDB_FILTER_ERR_INVALID_NUM_ARGS, SDB_FILTER_ERR_INVALID_TYPE, SDB_FILTER_ERR_INVALID_VALUE_EMPTY_STRING, 
    SDB_FILTER_ERR_INVALID_VALUE_SLASH, SDB_FILTER_ERR_INVALID_COMPARE_TYPE, SDB_FILTER_ERR_INVALID_RANGE, SDB_FILTER_ERR_NO_COL_FOUND, 
	SDB_FILTER_ERR_INVALID_NUM_ARRAY_ELEMENTS, SDB_FILTER_ERR_INVALID_RANGE_VALUE_DOTS }
