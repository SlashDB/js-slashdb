import { SDB_NULLSTR } from "./filterfunctions.js";

const SDB_BF_INVALID_SORT_COL = 'Column must be a non-empty string/cannot contain spaces/cannot begin with a number';
const SDB_BF_LIMIT_TYPE = 'Limit row number must be a positive integer value';
const SDB_BF_OFFSET_TYPE = 'Offset row number must be a positive integer value';
const SDB_BF_INVALID_WILDCARD = 'URL string placeholder must be a string, cannot contain slash (/)';
const SDB_BF_INVALID_NULLSTR = 'NULL string placeholder must be a string, cannot contain slash (/)'

/** 
 * Filter class for creating SlashDB-compatible URL strings.  Base class for `DataDiscoveryFilter` and `SQLPassThruFilter` classes.
 */
class BaseFilter {

   /**
   * A class for creating SlashDB-compatible URL strings
   * @param {string} [urlPlaceholder] - a string that contains a character or string to set for the placeholder query parameter (used to indicate what char/string
   * was used to replace '/' character in values contained in the URL that may contain the '/' character);  default is '__'
   */	
	constructor(urlPlaceholder = '__') {
		// will contain any query parameters that are set
		this.urlStringParams = {
			sort : { default: undefined, value: undefined },
			distinct : { default: false, value: false },
			limit: { default: undefined, value: undefined },
			offset: { default: undefined, value: undefined },
			transpose : { default: false, value: false },
			nil_visible: { default: false, value: false },
			nullStr: { default: '<null>', value: SDB_NULLSTR }	// SDB_NULLSTR can be changed using chgPlaceholder(null, value) - default is <null>
		};
	
		if (urlPlaceholder !== undefined) {
			if (typeof(urlPlaceholder) !== 'string' || urlPlaceholder.indexOf('/') > -1  || urlPlaceholder.trim().length < 1) {
				throw TypeError(SDB_BF_INVALID_WILDCARD);
			}
		}

		this._urlPlaceholder = urlPlaceholder;

		// for specifying which columns to return if desired
		this.returnColumns = undefined;
		
		// combines path and query parameters
		this.endpoint = null;
	}

	/**
	 * Sets the `placeholder` query string parameter; only used internally
	* @returns {string} an empty string, or a query parameter string for the placeholder query parameter 
	*/ 
	_urlPlaceholderFn() {
		return this._urlPlaceholder !== '__' ? `&placeholder=${this._urlPlaceholder}` : '';
	}	

		
	/**
	* Appends the URL with set of columns to return from request
	* @param {...string} columns - a list of column names (e.g. `'FirstName','LastName','Email'`)
	* @returns this object	
	*/ 
	cols(...columns) {
		this.returnColumns = this._columnArrayParser(...columns);
		return this.build();
	}

	/**
	* Set the sort query string parameter
	* @param {...string} columns - a list of column names to sort by (e.g. `'FirstName','LastName','Email'`)
	* @returns this object	
	*/ 
	sort(...columns) {
		this.urlStringParams['sort']['value'] = this._columnArrayParser(...columns);
		return this.build();
	}

	/**
	* Mark a column as descending for `sort()` method.  Not used in class; exposed externally as its own function in this module
	* @param {string} col - a column name to mark as descending
	* @returns {string} a column name that has been marked as descending for `sort()` method
	* @throws {TypeError} if column name given is not a string
	* @throws {SyntaxError} if column name given contains spaces or parses to a number
	*/ 
	_sort_desc(col) {
		
		if (typeof(col) !== 'string') {
			throw TypeError(SDB_BF_INVALID_SORT_COL);
		}
		if (!isNaN(parseInt(col[0])) || col.indexOf(' ') > -1) {
			throw SyntaxError(SDB_BF_INVALID_SORT_COL);
		}

		return `-${col}`;
	}

	/**
	* Mark a column as ascending for `sort()` method.  Not used in class; exposed externally as its own function in this module; note
	* that this method doesn't do any modifications to the column name, it's here just so developers have an explicit method
	* @param {string} col - a column name to mark as descending
	* @returns {string} a column name that has been marked as ascending for `sort()` method (effectively, no changes to input)
	* @throws {TypeError} if column name given is not a string
	* @throws {SyntaxError} if column name given contains spaces or parses to a number
	*/ 
	_sort_asc(col) {
		
		if (typeof(col) !== 'string') {
			throw TypeError(SDB_BF_INVALID_SORT_COL);
		}
		if (!isNaN(parseInt(col[0])) || col.indexOf(' ') > -1) {
			throw SyntaxError(SDB_BF_INVALID_SORT_COL);
		}

		return `${col}`;
	}	

	/**
	* Sets the `distinct` query string parameter
	* @param {boolean} [toggle] - sets the parameter if not provided; removes the parameter if set to false
	* @returns this object
	*/ 
	distinct(toggle = true) {
		if (toggle === true || toggle === false) {
			this.urlStringParams['distinct']['value'] = toggle === true;
		}
		return this.build();
	}

	/**
	* Sets the `limit` query string parameter
	* @param {number | boolean} [numRows] - sets the parameter with the value provided; removes the 
	* parameter if not provided or set to false
	* @returns this object	
	* @throws {TypeError} if value provided is not an integer or < 1
	*/ 	
	limit(numRows = false) {
		if (numRows) {
			if ( !Number.isInteger(numRows) || numRows < 1) {
				throw TypeError(SDB_BF_LIMIT_TYPE);
			}
		}
		this.urlStringParams['limit']['value'] = numRows !== false ? numRows : this.urlStringParams['limit']['default'];
		return this.build();
	}

	/**
	* Sets the `offset` query string parameter
	* @param {number | boolean} [numRows] - sets the parameter with the value provided; removes the
	* parameter if not provided or set to false
	* @returns this object	
	* @throws {TypeError} if value provided is not an integer or < 1
	*/ 		
	offset(numRows = false) {
		if (numRows) {
			if ( !Number.isInteger(numRows) || numRows < 1) {
				throw TypeError(SDB_BF_OFFSET_TYPE);
			}
		}
		this.urlStringParams['offset']['value'] = numRows !== false ? numRows : this.urlStringParams['offset']['default'];
		return this.build();
	}

	/**
	* Sets the `nullStr` query string parameter
	*
	* When using the composable filter functions, if the `chgPlaceHolder` function is invoked to change the default
	* `null` placeholder, any `BaseFilter`, `DataDiscoveryFilter`, and `SQLPassThruFilter` objects created after changing
	* the placeholder will have the `nullStr` query string parameter automatically set to the value passed to `chgPlaceHolder`.
	* @param {string} [nullString] - sets parameter with the value provided, resets to default if not given
	* @returns this object	
	* @throws {TypeError} if value provided is not a valid string
	*/ 		
	nullStr(nullString) {
		if (arguments.length > 0) {
			if ( typeof(nullString) !== 'string' || nullString.indexOf('/') > -1 ) {
					throw TypeError(SDB_BF_INVALID_NULLSTR);
				}
		}
		this.urlStringParams['nullStr']['value'] = arguments.length > 0 ? nullString : this.urlStringParams['nullStr']['default'];
		return this.build();
	}

	/**
	* Sets the `transpose` query string parameter
	* @param {boolean} [toggle] - sets parameter if not provided; removes the parameter if set to false
	* @returns this object	
	*/ 	
	transpose(toggle = true) {
		if (toggle === true || toggle === false) {
			this.urlStringParams['transpose']['value'] = toggle === true;
		}
		return this.build();
	}

	/**
	* Sets the `nil_visible` query string parameter
	* @param {boolean} [toggle] - sets the parameter if not provided; removes the parameter if set to false
	* @returns this object	
	*/ 	
	xmlNilVisible(toggle = true) {
		this.urlStringParams['nil_visible']['value'] = toggle === true;
		return this.build();
	}	

	/**
	* Parses out column names; used by `sort()` and `cols()` methods.  Not called directly.
	* @param {...string} columns - a comma delimited list of column names to parse (e.g. `'FirstName','LastName','Email'`)
	* @returns {undefined} if one column given and value of column is false (resets `sort()`/`cols()`)
	* @returns {string} string of column names separated by ','
	* @throws {TypeError} if no columns given, or if any column names are not strings, or are empty strings
	* @throws {SyntaxError} if any column names contain spaces, or parse to numbers
	*/ 
	_columnArrayParser(...columns) {
		let s = '';
		if (columns.length < 1) {
			throw TypeError(SDB_BF_INVALID_SORT_COL);
		}
		
		if (columns.length === 1 && columns[0] === false) {
			return undefined;
		}
		
		else {
			for (const col of columns) {

				if (typeof(col) !== 'string' || col.trim().length < 1) {
					throw TypeError(SDB_BF_INVALID_SORT_COL);
				}
				if (!isNaN(parseInt(col[0])) || col.indexOf(' ') > -1) {
					throw SyntaxError(SDB_BF_INVALID_SORT_COL);
				}

				s += `${col},`;
			}
			s = s.slice(0,s.length-1);
			return s;
		}
	}

	/**
	* Builds the URL endpoint string from the filter strings provided to the class and the query string parameters that have been set;
	* called at the end of most filter string methods and query string parameter methods
	* @returns {Object} the current instance of this class
	*/ 
	build() {
		let columns = this.returnColumns ? `/${this.returnColumns}` : '';

		let paramString = '';
		for (const p in this.urlStringParams) {

			if (typeof this.urlStringParams[p] === 'object' && this.urlStringParams[p] !== null ) {
				if (this.urlStringParams[p]['default'] !== this.urlStringParams[p]['value']) {
					paramString += `${p}=${this.urlStringParams[p]['value']}&` ;	
				}
	   		}
		}

		paramString = paramString.slice(0,paramString.length-1);	// chop trailing &
		paramString += this._urlPlaceholderFn();

		this.endpoint = paramString.length > 0 ? `${columns}?${paramString}` : `${columns}`;
		
		return this;
	}

	/**
	* Returns the URL endpoint string in this class created by `build()`
	* @returns {string} the URL endpoint string
	*/ 	
	str() {
		return this.endpoint;
	}
}

// break out the _sort_desc/asc functions in the BaseFilter so they can be used standalone
const desc = BaseFilter.prototype._sort_desc;
const asc = BaseFilter.prototype._sort_asc;

export { BaseFilter, desc, asc }
export { SDB_BF_INVALID_SORT_COL, SDB_BF_LIMIT_TYPE, SDB_BF_OFFSET_TYPE, SDB_BF_INVALID_NULLSTR }