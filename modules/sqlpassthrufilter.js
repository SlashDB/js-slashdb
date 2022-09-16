import { BaseFilter } from "./basefilter.js";

const SDB_SPTF_INVALID_RESOURCE = 'Resource must be a non-empty string/cannot contain spaces/cannot begin with a number/cannot contain "/" character';
const SDB_SPTF_INVALID_FILTER = 'Filter must be a non-empty string, must contain at least one "/" character';


// construct a SlashDB path with filter for resource
class SQLPassThruFilter extends BaseFilter {
	constructor() {
		super()

		// the path as it is built up
		this.pathString = '';
		
		this.build();
	}
	
	// add a filter to current context, accepts strings created using filter expression functions
	addFilter(filterString) {

		if (typeof(filterString) !== 'string' || filterString.trim().length < 1) {
			throw TypeError(SDB_SPTF_INVALID_FILTER);
		}
		if (filterString.indexOf('/') === -1) {
			throw SyntaxError(SDB_SPTF_INVALID_FILTER);
		}

		
		this.pathString += `/${filterString}`; 
		if (this.filters[this.lastContext] === undefined) {
			this.filters[this.lastContext] = [];
		}
		this.filters[this.lastContext].push(`${filterString}`);
			
		return this.build();
	}

	count() {
		console.log('SQLPassThru count qparam');
	}

	xmlType() {
		console.log('SQLPassThru xmlType qparam')
	}

	// generate the full filter string
	build() {
		let columns = this.returnColumns ? `/${this.returnColumns}` : '';

		let paramString = '';
		for (const p in this.queryParams) {
			if (this.queryParams[p] !== undefined && this.queryParams[p] !== false) {
				paramString += `${p}=${this.queryParams[p]}&` ;
			}
		}
		paramString = paramString.slice(0,paramString.length-1);	// chop trailing &
		
		this.endpoint = paramString.length > 0 ? `${this.pathString}${columns}?${paramString}` : this.pathString;
		
		return this;
	}

	str() {
		return this.endpoint;
	}

}


export { SQLPassThruFilter }

// for testing only
export { SDB_SPTF_INVALID_RESOURCE, SDB_SPTF_INVALID_FILTER }
