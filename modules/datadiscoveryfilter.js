import { SDB_SEPARATOR } from "./filterfunctions.js";
import { BaseFilter } from "./basefilter.js";

const SDB_DDF_INVALID_RESOURCE = 'Resource must be a non-empty string/cannot contain spaces/cannot begin with a number/cannot contain "/" character';
const SDB_DDF_INVALID_FILTER = 'Filter must be a non-empty string, must contain at least one "/" character';
const SDB_DDF_INVALID_WILDCARD = 'Wildcard must be a string, cannot contain slash (/)';
const SDB_DDF_INVALID_SEPARATOR = 'Separator must be a string, cannot contain slash (/)';
const SDB_DDF_DEPTH_TYPE = 'Depth must be a positive integer value';
const SDB_DDF_XSDCARD_TYPE = 'xsdCardinality must be a string or positive integer'

// construct a SlashDB path with filter for resource
class DataDiscoveryFilter extends BaseFilter {
	constructor(filter = null, wildcard = '*', separator = ',') {
		super()

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
			headers: false,
			csvNullStr: false,
			href: false,
			cardinality: undefined
		}
		
		// the path as it is built up
		this.pathString = '';
		this.pathString += filter == null ? '' : `/${filter}`;

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

	stream(toggle = true) {
		this.urlStringParams['stream'] = toggle === true;
		return this.build();
	}

	depth(level = false) {
		if (level) {
			if ( !Number.isInteger(level) || level < 1) {
				throw TypeError(SDB_DDF_DEPTH_TYPE);
			}
		}
		this.urlStringParams['depth'] = level !== false ? level : undefined;
		return this.build();
	}
		

	wantarray(toggle = true) {
		this.urlStringParams['wantarray'] = toggle === true;
		return this.build();
	}
		
	// for CSV data only - will be ignored otherwise 
	csvHeader(toggle = true) {
		this.urlStringParams['headers'] = toggle === true;
		return this.build();
	}

	csvNullStr(toggle = true) {
		this.urlStringParams['csvNullStr'] = toggle === true;
		return this.build();
	}

	jsonHref(toggle = true) {
		this.urlStringParams['href'] = toggle === true;
		return this.build();
	}	

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
	#wildcard() {
		return this.wildcard !== '*' ? `&wildcard=${this.wildcard}` : '';
	}	

	// add separator to query string - only used internally
	#separator() {
		return this.separator !== ',' ? `&separator=${this.separator}` : '' ;
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
		paramString += this.#separator() + this.#wildcard();
		
		this.endpoint = paramString.length > 0 ? `${this.pathString}${columns}?${paramString}` : `${this.pathString}${columns}`;
		
		return this;
	}

	str() {
		return this.endpoint;
	}  	

}

export { DataDiscoveryFilter }

// for testing only
export { SDB_DDF_INVALID_WILDCARD, SDB_DDF_INVALID_SEPARATOR,
		SDB_DDF_DEPTH_TYPE, SDB_DDF_XSDCARD_TYPE,
		SDB_DDF_INVALID_RESOURCE, SDB_DDF_INVALID_FILTER }
