const SDB_BF_INVALID_SORT_COL = 'Column must be a non-empty string/cannot contain spaces/cannot begin with a number';
const SDB_BF_LIMIT_TYPE = 'Limit row number must be a positive integer value';
const SDB_BF_OFFSET_TYPE = 'Offset row number must be a positive integer value';

// construct a SlashDB path with filter for resource
class BaseFilter {
	constructor() {
		// will contain any query parameters that are set
		this.urlStringParams = {
			sort : undefined,
			distinct : false,
			limit: undefined,
			offset: undefined,
			transpose : false,
			nil_visible: false,
		};
	
		// for specifying which columns to return if desired
		this.returnColumns = undefined;
		
		// combines path and query parameters
		this.endpoint = null;
	}

	// specify which columns to return
	cols(...columns) {
		this.returnColumns = this.#columnArrayParser(...columns);
		return this.build();
	}


	sort(...columns) {
		this.urlStringParams['sort'] = this.#columnArrayParser(...columns);
		return this.build();
	}

	// helper for sort to mark column sort as descending, exposed as external function desc, not used internally
	_sort_desc(col) {
		
		if (typeof(col) !== 'string') {
			throw TypeError(SDB_BF_INVALID_SORT_COL);
		}
		if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1) {
			throw SyntaxError(SDB_BF_INVALID_SORT_COL);
		}

		return `-${col}`;
	}

	// just to have an explicit ascending sort - doesn't do any modifications, exposed as external function asc, not used internally
	_sort_asc(col) {
		
		if (typeof(col) !== 'string') {
			throw TypeError(SDB_BF_INVALID_SORT_COL);
		}
		if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1) {
			throw SyntaxError(SDB_BF_INVALID_SORT_COL);
		}

		return `${col}`;
	}	

	distinct(toggle = true) {
		this.urlStringParams['distinct'] = toggle === true;
		return this.build();
	}

	limit(numRows = false) {
		if (numRows) {
			if ( !Number.isInteger(numRows) || numRows < 1) {
				throw TypeError(SDB_BF_LIMIT_TYPE);
			}
		}
		this.urlStringParams['limit'] = numRows !== false ? numRows : undefined;
		return this.build();
	}

	offset(numRows = false) {
		if (numRows) {
			if ( !Number.isInteger(numRows) || numRows < 1) {
				throw TypeError(SDB_BF_OFFSET_TYPE);
			}
		}
		this.urlStringParams['offset'] = numRows !== false ? numRows : undefined;
		return this.build();
	}

	transpose(toggle = true) {
		this.urlStringParams['transpose'] = toggle === true;
		return this.build();
	}

	xmlNilVisible(toggle = true) {
		this.urlStringParams['nil_visible'] = toggle === true;
		return this.build();
	}	

	// used by both sort() and cols()
	#columnArrayParser(...columns) {
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
				if (!isNaN(parseInt(col[0])) || col.indexOf(' ') !== -1) {
					throw SyntaxError(SDB_BF_INVALID_SORT_COL);
				}

				s += `${col},`;
			}
			s = s.slice(0,s.length-1);
			return s;
		}
	}

	// generate the full filter string
	build() {
		let columns = this.returnColumns ? `/${this.returnColumns}` : '';

		let paramString = '';
		for (const p in this.urlStringParams) {
			if (this.urlStringParams[p] !== undefined && this.urlStringParams[p] !== false) {
				paramString += `${p}=${this.urlStringParams[p]}&` ;
			}
		}
		paramString = paramString.slice(0,paramString.length-1);	// chop trailing &
		
		this.endpoint = paramString.length > 0 ? `${columns}?${paramString}` : `${columns}`;
		
		return this;
	}

	str() {
		return this.endpoint;
	}
}

// break out the _sort_desc/asc functions in the BaseFilter so they can be used standalone
const desc = BaseFilter.prototype._sort_desc;
const asc = BaseFilter.prototype._sort_asc;

export { BaseFilter, desc, asc }
export { SDB_BF_INVALID_SORT_COL, SDB_BF_LIMIT_TYPE, SDB_BF_OFFSET_TYPE }