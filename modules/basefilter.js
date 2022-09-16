const SDB_BF_INVALID_SORT_COL = 'Column must be a non-empty string/cannot contain spaces/cannot begin with a number';
const SDB_BF_LIMIT_TYPE = 'Limit row number must be a positive integer value';
const SDB_BF_OFFSET_TYPE = 'Offset row number must be a positive integer value';

// construct a SlashDB path with filter for resource
class BaseFilter {
	constructor() {
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
		this.queryParams['sort'] = this.#columnArrayParser(...columns);
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
		this.queryParams['distinct'] = toggle === true;
		return this.build();
	}

	limit(numRows = false) {
		if (numRows) {
			if ( !Number.isInteger(numRows) || numRows < 1) {
				throw TypeError(SDB_BF_LIMIT_TYPE);
			}
		}
		this.queryParams['limit'] = numRows !== false ? numRows : undefined;
		return this.build();
	}

	offset(numRows = false) {
		if (numRows) {
			if ( !Number.isInteger(numRows) || numRows < 1) {
				throw TypeError(SDB_BF_OFFSET_TYPE);
			}
		}
		this.queryParams['offset'] = numRows !== false ? numRows : undefined;
		return this.build();
	}

	transpose(toggle = true) {
		this.queryParams['transpose'] = toggle === true;
		return this.build();
	}

	xmlNilVisible(toggle = true) {
		this.queryParams['nil_visible'] = toggle === true;
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

	build() {
		return this;
	}
}

// break out the _sort_desc/asc functions in the BaseFilter so they can be used standalone
const desc = BaseFilter.prototype._sort_desc;
const asc = BaseFilter.prototype._sort_asc;

export { BaseFilter, desc, asc }
export { SDB_BF_INVALID_SORT_COL, SDB_BF_LIMIT_TYPE, SDB_BF_OFFSET_TYPE }