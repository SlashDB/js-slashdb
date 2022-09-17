import { BaseFilter } from "./basefilter.js";

const SDB_SPTF_INVALID_QUERY = 'Query must be a non-empty string/cannot contain spaces/cannot begin with a number/cannot contain "/" character';
const SDB_SPTF_INVALID_PARAM_NAME = 'Parameter name must be a non-empty string. To pass JSON/CSV/XML, use addBodyParam() method';
const SDB_SPTF_INVALID_PARAM_VALUE = 'Parameter value must be a non-empty string or integer. To pass JSON/CSV/XML, use addBodyParam() method';


// construct a SlashDB path with filter for resource
class SQLPassThruFilter extends BaseFilter {
	constructor() {
		super()

		this.queryParams = {};
		this.urlStringParams = {
			...this.urlStringParams,
			count: false,
			xmlType: undefined,
		};

		this.pathString = '';
		this.build();
	}
	
	// add a query parameter to the URL string
	addParam(paramName, paramValue) {

		if (typeof(paramName) !== 'string' || paramName.trim().length < 1) {
			if (!isNaN(parseInt(paramName)) || resource.indexOf(' ') !== -1) {
				throw SyntaxError(SDB_SPTF_INVALID_PARAM_NAME);
			}
			throw TypeError(SDB_SPTF_INVALID_PARAM_NAME);
		}

		if (typeof(paramValue) !== 'number' && (typeof(paramValue) !== 'string' || paramValue.trim().length < 1)) {
			throw TypeError(SDB_SPTF_INVALID_PARAM_VALUE);
		}

		this.queryParams[paramName] = paramValue;
		this.pathString += `/${paramName}/${paramValue}`; 

		return this.build();
	}

	count(toggle = true) {
		this.urlStringParams['count'] = toggle === true;
		return this.build();
	}

	xmlType(val) {
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

	str() {
		return this.endpoint;
	}

}


export { SQLPassThruFilter }

// for testing only
export { SDB_SPTF_INVALID_QUERY, SDB_SPTF_INVALID_PARAM_NAME, SDB_SPTF_INVALID_PARAM_VALUE }
