import { BaseFilter } from "./basefilter.js";

const SDB_SPTF_INVALID_PARAM_FORMAT = 'Parameters must be given as an object of key/value pairs';
const SDB_SPTF_INVALID_PARAM_NAME = "Parameter name must be a non-empty string, cannot contain '/' character";
const SDB_SPTF_INVALID_PARAM_VALUE = "Parameter value must be a non-empty string or integer, cannot contain '/'";
const SDB_SPTF_INVALID_XMLTYPE = "Parameter must be a non-empty string";

// construct a SlashDB path with filter for resource
class SQLPassThruFilter extends BaseFilter {
	constructor(params = undefined) {
		super()

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
	
	// add a query parameter to the URL string
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

	count(toggle = true) {
		this.urlStringParams['count'] = toggle === true;
		return this.build();
	}

	xmlType(val = undefined) {
		if (val) {
			if (typeof(val) !== 'string') {
				throw TypeError(SDB_SPTF_INVALID_XMLTYPE);
			}
		}
		this.urlStringParams['xmlType'] = val;
		return this.build();
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
		
		this.endpoint = paramString.length > 0 ? `${this.pathString}${columns}?${paramString}` : `${this.pathString}${columns}`;
		
		return this;
	}
}


export { SQLPassThruFilter }

// for testing only
export { SDB_SPTF_INVALID_PARAM_FORMAT, SDB_SPTF_INVALID_PARAM_NAME, SDB_SPTF_INVALID_PARAM_VALUE,SDB_SPTF_INVALID_XMLTYPE }
