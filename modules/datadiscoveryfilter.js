import { SDB_SEPARATOR } from "./filterfunctions.js";
import { BaseFilter } from "./basefilter.js";

const SDB_DDF_INVALID_RESOURCE = 'Resource must be a non-empty string/cannot contain spaces/cannot begin with a number/cannot contain "/" character';
const SDB_DDF_INVALID_FILTER = 'Filter must be a non-empty string, must contain at least one "/" character';
const SDB_DDF_INVALID_WILDCARD = 'Wildcard must be a string, cannot contain slash (/)';
const SDB_DDF_INVALID_SEPARATOR = 'Separator must be a string, cannot contain slash (/)';
const SDB_DDF_DEPTH_TYPE = 'Depth must be a positive integer value';
const SDB_DDF_XSDCARD_TYPE = 'xsdCardinality must be a string or positive integer'

/** 
 * Class for creating URL strings for SlashDB Data Discovery functionality
 */
class DataDiscoveryFilter extends BaseFilter {

   /**
   * Create a DataDiscoveryFilter object for making SlashDB-compatible URL strings
   * @extends BaseFilter
   * @param {string} [filter] - optional filter string to instantiate object with; accepts strings created using filter expression functions
   * @param {string} [wildcard] - set if using a special wildcard character(s) in URL strings (default is '*')
   * @param {string} [separator] - set if using a special separator character(s) in URL strings (default is ',')
   * @param {string} [urlPlaceholder] -  a string that contains a character(s) to set for the placeholder query parameter (used to indicate what character(s)
   * was used to replace '/' character in values contained in the URL that may contain the '/' character);  default is '__'
   * @throws {TypeError} if wildcard or separator parameters are not strings, are empty strings, or contain '/' character
   * @throws {TypeError} if filter parameter  is not a string or an empty string
   * @throws {SyntaxError} if filter does not contain '/' character
   */    	
	constructor(filter = null, wildcard = '*', separator = ',', urlPlaceholder = '__') {
		super(urlPlaceholder);

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

		this.urlStringParams = {
			...this.urlStringParams,
			stream: false,
			depth: undefined,
			headers: {default: true, value: true},
			csvNullStr: false,
			href: {default: true, value: true},
			cardinality: undefined,
			wantarray: false,
		}
		
		// the path as it is built up
		this.pathString = '';
		this.pathString += filter == null ? '' : `/${filter}`;

		this.build();
	}

	/**
	* Add a filter string to this object and stores info about filter; accepts strings created using filter expression functions
	* @param {string} filterString - a filter string; can contain multiple filters (e.g. 'FirstName/Tim/LastName/Smith') or values 
	* created using filter expression functions 
	*
	* e.g. and(eq('FirstName','Tim'),eq('LastName','Smith'))
	*
	* @returns {DataDiscoveryFilter} this object
	* @throws {TypeError} - if filterString parameter is not a string or is an empty string
	* @throws {SyntaxError} - if filterString parameter does not contain '/' character
	*/ 	
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

	/**
	* Adds a resource to this object and stores info about it 
	* @param {string} resource - resource name to add to object
	* @returns {DataDiscoveryFilter} this object
	* @throws {TypeError} - if resource parameter is not a string or is an empty string
	* @throws {SyntaxError} - if resource parameter contains '/' character
	* @throws {SyntaxError} - if resource parameter parses to a number or contains a space
	*/ 		
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

	/**
	* Sets the stream query string parameter
	* @param {boolean} [toggle] - sets the stream query string parameter if not provided; removes the query string parameter if set to false
	* @returns {DataDiscoveryFilter} this object
	*/ 		 	
	stream(toggle = true) {
		this.urlStringParams['stream'] = toggle === true;
		return this.build();
	}

	/**
	* Sets the depth query string parameter
	* @param {number | boolean} [level] - sets the depth query string parameter with the value provided; removes the query string
	* parameter if not provided or set to false
	* @returns {DataDiscoveryFilter} this object
	* @throws {TypeError} if value provided is not an integer or < 1
	*/ 	
	depth(level = false) {
		if (level) {
			if ( !Number.isInteger(level) || level < 1) {
				throw TypeError(SDB_DDF_DEPTH_TYPE);
			}
		}
		this.urlStringParams['depth'] = level !== false ? level : undefined;
		return this.build();
	}
		

	/**
	* Sets the wantarray query string parameter
	* @param {boolean} [toggle] - sets the wantarray query string parameter if not provided; removes the query string parameter if set to false
	* @returns {DataDiscoveryFilter} this object
	*/ 	
	wantarray(toggle = true) {
		this.urlStringParams['wantarray'] = toggle === true;
		return this.build();
	}

	/**
	* Sets the headers query string parameter; applies only to CSV formatted data
	* @param {boolean} [toggle] - sets the headers query string parameter if not provided; removes the query string parameter if set to false.
	* @returns {DataDiscoveryFilter} this object
	*/ 	
	csvHeader(toggle = true) {
		this.urlStringParams['headers']['value'] = toggle === true;
		return this.build();
	}

	/**
	* Sets the csvNullStr query string parameter; applies only to CSV formatted data
	* @param {boolean} [toggle] - sets the csvNullStr query string parameter if not provided; removes the query string parameter if set to false.
	* @returns {DataDiscoveryFilter} this object
	*/	
	csvNullStr(toggle = true) {
		this.urlStringParams['csvNullStr'] = toggle === true;
		return this.build();
	}

	/**
	* Sets the href query string parameter; applies only to JSON formatted data
	* @param {boolean} [toggle] - sets the href query string parameter if not provided; removes the query string parameter if set to false.
	* @returns {DataDiscoveryFilter} this object
	*/		
	jsonHref(toggle = true) {
		this.urlStringParams['href']['value'] = toggle === true;
		return this.build();
	}	

	/**
	* Sets the cardinality query string parameter; applies only to XSD formatted data
	* @param {string} [value] - the value for the cardinality parameter (default is 'unbounded'); removes the query string parameter if set to false
	* @returns {DataDiscoveryFilter} this object	
	* @throws {TypeError} if value parameter is an empty string
	* @throws {TypeError} if value parameter is not an integer or < 0
	*/		
	xsdCardinality(value = 'unbounded') {

		if (value === false) {
			this.urlStringParams['cardinality'] = undefined;
		}
		
		else if (value !== 'unbounded') {
			if (typeof(value) === 'string' && value.trim().length < 1) {
				throw TypeError(SDB_DDF_XSDCARD_TYPE);
			}

			else if ( !Number.isInteger(value) || value < 0) {
				throw TypeError(SDB_DDF_XSDCARD_TYPE);
			}


		}
		
		this.urlStringParams['cardinality'] = value;
		return this.build();
	}	

	// add wildcard to query string - only used internally
	_setWildcard() {
		return this.wildcard !== '*' ? `&wildcard=${this.wildcard}` : '';
	}	

	// add separator to query string - only used internally
	_setSeparator() {
		return this.separator !== ',' ? `&separator=${this.separator}` : '' ;
	}

	/**
	* Builds the URL endpoint string from the filter strings provided to the class and the query string parameters that have been set;
	* called at the end of most filter string methods and query string parameter methods
	* @returns {DataDiscoveryFilter} this object
	*/ 
	build() {
		let columns = this.returnColumns ? `/${this.returnColumns}` : '';

		let paramString = '';
		for (const p in this.urlStringParams) {

			// the parameters that have default true values (headers, href) are stored as 
			// objects with a default key/value pair and current value key/value pair, so must
			// be handled a bit differently
			if (typeof this.urlStringParams[p] === 'object' && this.urlStringParams[p] !== null ) {
				  	if (this.urlStringParams[p]['default'] !== this.urlStringParams[p]['value']) {
			  			paramString += `${p}=${this.urlStringParams[p]['value']}&` ;	
			  	}
			 }
			else if (this.urlStringParams[p] !== undefined && this.urlStringParams[p] !== false) {
				paramString += `${p}=${this.urlStringParams[p]}&` ;
			}
		}
		paramString = paramString.slice(0,paramString.length-1);	// chop trailing &
		paramString += this._setSeparator() + this._setWildcard() + this._urlPlaceholderFn();
		
		this.endpoint = paramString.length > 0 ? `${this.pathString}${columns}?${paramString}` : `${this.pathString}${columns}`;
		
		return this;
	}
}

export { DataDiscoveryFilter }

// for testing only
export { SDB_DDF_INVALID_WILDCARD, SDB_DDF_INVALID_SEPARATOR,
		SDB_DDF_DEPTH_TYPE, SDB_DDF_XSDCARD_TYPE,
		SDB_DDF_INVALID_RESOURCE, SDB_DDF_INVALID_FILTER }
