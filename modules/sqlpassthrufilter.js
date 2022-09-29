import { BaseFilter } from "./basefilter.js";

const SDB_SPTF_INVALID_PARAM_FORMAT = 'Parameters must be given as an object of key/value pairs';
const SDB_SPTF_INVALID_PARAM_NAME = "Parameter name must be a non-empty string, cannot contain '/' character";
const SDB_SPTF_INVALID_PARAM_VALUE = "Parameter value must be a non-empty string or integer, cannot contain '/'";
const SDB_SPTF_INVALID_XMLTYPE = "Parameter must be a non-empty string";

/** 
 * Class for creating URL strings for SlashDB SQL Pass-Thru functionality
 */
class SQLPassThruFilter extends BaseFilter {

   /**
   * Create a SQLPassThruFilter object for making SlashDB-compatible URL strings
   * @extends BaseFilter
   * @param {Object} [params] - optional object of key/value pairs representing SQL query parameters to instantiate this object with
   * @param {string} [urlPlaceholder] -  a string that contains a character(s) to set for the placeholder query parameter (used to indicate what character(s)
   * was used to replace '/' character in values contained in the URL that may contain the '/' character);  default is '__'
   */    	
	constructor(params = undefined, urlPlaceholder = '__') {
		super(urlPlaceholder)

		this.pathString = '';
		this.queryParams = {};

		if (params) {
			this.addParams(params);
		}

		this.urlStringParams = {
			...this.urlStringParams,
			count: false,
			xmlType: undefined,
		};

		this.build();
	}
	
	/**
	* Adds SQL query parameters to this object and stores info about them
	* @param {Object} params - an object of key/value pairs containing parameter names and values
	* @returns {SQLPassThruFilter} this object
	* @throws {SyntaxError} - if params parameter is not an object
	* @throws {SyntaxError} - if any object keys parse to numbers
	* @throws {TypeError} - if any object keys are not strings or contain spaces
	* @throws {TypeError} - if any object keys contain '/' character
	* @throws {TypeError} - if any object values are not strings or numbers, or are empty strings
	* @throws {TypeError} - if any object values contain '/' character
	*/ 	
	addParams(params) {

		if (! (typeof(params) === 'object' && !Array.isArray(params)) ){
			throw SyntaxError(SDB_SPTF_INVALID_PARAM_FORMAT);
		}

		for (const key in params) {

			if (!isNaN(parseInt(key)) ) {
				throw SyntaxError(SDB_SPTF_INVALID_PARAM_NAME);
			}

			if (typeof(key) !== 'string' || key.indexOf(' ') !== -1) {
				throw TypeError(SDB_SPTF_INVALID_PARAM_NAME);
			}
	
			if (key.indexOf('/') !== -1) {
				throw TypeError(SDB_SPTF_INVALID_PARAM_NAME);
			}

			if (typeof(params[key]) !== 'number' && (typeof(params[key]) !== 'string' || params[key].trim().length < 1)) {
				throw TypeError(SDB_SPTF_INVALID_PARAM_VALUE);
			}

			if ( typeof(params[key]) === 'string' && params[key].indexOf('/') !== -1) {
				throw TypeError(SDB_SPTF_INVALID_PARAM_VALUE);
			}

			this.queryParams[key] = params[key];
			this.pathString += `/${key}/${params[key]}`;
		}

		return this.build();
	}

	/**
	* Sets the count query string parameter
	* @param {boolean} [toggle] - sets the count query string parameter if not provided; removes the query string parameter if set to false
	* @returns {SQLPassThruFilter} this object	
	*/ 		
	count(toggle = true) {
		this.urlStringParams['count'] = toggle === true;
		return this.build();
	}

	/**
	* Sets the xmlType query string parameter
	* @param {string} [val] - value for the xmlType parameter; removes the query string parameter if not provided
	* @returns {SQLPassThruFilter} this object	
	* @throws {TypeError} if val paramter is not a string
	*/ 		
	xmlType(val = undefined) {
		if (val) {
			if (typeof(val) !== 'string') {
				throw TypeError(SDB_SPTF_INVALID_XMLTYPE);
			}
		}
		this.urlStringParams['xmlType'] = val;
		return this.build();
	}

	/**
	* Builds the URL endpoint string from the filter strings provided to the class and the query string parameters that have been set;
	* called at the end of most filter string methods and query string parameter methods
	* @returns {SQLPassThruFilter} the current instance of this class
	*/ 	
	build() {
		let columns = this.returnColumns ? `/${this.returnColumns}` : '';

		let paramString = '';
		for (const p in this.urlStringParams) {
			if (this.urlStringParams[p] !== undefined && this.urlStringParams[p] !== false) {
				paramString += `${p}=${this.urlStringParams[p]}&` ;
			}
		}
		paramString = paramString.slice(0,paramString.length-1);	// chop trailing &
		paramString += this._urlPlaceholderFn();

		this.endpoint = paramString.length > 0 ? `${this.pathString}${columns}?${paramString}` : `${this.pathString}${columns}`;
		
		return this;
	}
}


export { SQLPassThruFilter }

// for testing only
export { SDB_SPTF_INVALID_PARAM_FORMAT, SDB_SPTF_INVALID_PARAM_NAME, SDB_SPTF_INVALID_PARAM_VALUE,SDB_SPTF_INVALID_XMLTYPE }
