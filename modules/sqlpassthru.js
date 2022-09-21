import { SlashDBClient } from './slashdbclient.js';
import { SQLPassThruFilter } from './sqlpassthrufilter.js';
import { BaseRequestHandler } from './baserequesthandler.js';

const SDB_SPTQL_NO_CLIENTOBJ = 'Parameter clientObj missing or not valid SlashDBClient object';

// get list of queries
class SQLPassThruQueryList {
    constructor(clientObj) {
        
        if (!clientObj || !(clientObj instanceof SlashDBClient)) {
            throw ReferenceError(SDB_SPTQL_NO_CLIENTOBJ);
        }

        this.sdbClient = clientObj;
    }

    async getQueryList(dbName = undefined) {
        let queryList = await this.sdbClient.getQueryDef();
        const queries = {};  

        
        // create a query object for each query in the list
        for (const query in queryList) {
            
            if (dbName) {
                if (queryList[query]['database'] !== dbName) {
                    continue;
                }
            }
            
            // required since url_template is not included when getQueryDef returns all queries, only for individual ones
            const q = await this.sdbClient.getQueryDef(query);  

            // find parameters in URL template string and create list
            let params = []
            const tokens = q.url_template.match(/{(.*?)}/gm);
            if (tokens) {
                for (let t of tokens) {
                    t = t.replaceAll('{','').replaceAll('}','');;
                    params.push(t);
                }
            }

            queries[q.query_id] = new SQLPassThruQuery(q.query_id, this.sdbClient, q.http_methods, params); 

            // remove HTTP methods that are disabled from the newly created query object
            const methods = ['GET','POST','PUT','DELETE'];
            for (const m of methods) {
                if (q.http_methods.hasOwnProperty(m) && q.http_methods[m] === true) {
                    continue;
                }
                else {
                    queries[q.query_id][m.toLowerCase()] = null;
                }
            }
        }
        
        return queries;
    }

}

const SDB_SPTQ_NO_CLIENTOBJ = 'Parameter clientObj missing or not valid SlashDBClient object';
const SDB_SPTQ_INVALID_QUERYNAME = 'Parameter queryName must be a non-empty string';
const SDB_SPTQ_INVALID_PATH_EMPTY = 'Empty path given';
const SDB_SPTQ_INVALID_PATH_TYPE = 'Path is not a string or a DataDiscoveryFilter object';

class SQLPassThruQuery extends BaseRequestHandler {

    constructor(queryName, clientObj, methods=null, params=null) {
        super(clientObj)

		if (typeof(queryName) !== 'string' || queryName.trim().length < 1) {
			throw TypeError(SDB_SPTQ_INVALID_QUERYNAME);
		}
		if (queryName.indexOf('/') !== -1) {
			throw SyntaxError(SDB_SPTQ_INVALID_QUERYNAME);
		}

		if (!isNaN(parseInt(queryName)) || queryName.indexOf(' ') !== -1) {
			throw SyntaxError(SDB_SPTQ_INVALID_QUERYNAME);
		}
        
        // object key/value pairs of methods
        if (methods) {
            this.methods = methods;
        }

        // array of parameters
        if (params) {
            this.params = params;
        }

        this.queryName = queryName;
        this.queryPrefix = '/query/';

    }

    buildEndpointString(path) {

        if (! this.sdbClient || ! (this.sdbClient instanceof SlashDBClient)) {
            throw ReferenceError(SDB_SPTQ_NO_CLIENTOBJ);
        }
        
        let endpoint = this.queryPrefix + `${this.queryName}/`;
        
        // if no path is provided, the HTTP operation just request to execute the query w/o parameters
        if (!path) {
            return this.sdbClient.host + endpoint;
        }

        
        // path can be string or SQLPassThruFilter object
        if (typeof(path) === 'string') {
            if (path.trim().length < 1) {
                throw SyntaxError(SDB_SPTQ_INVALID_PATH_EMPTY);
            }

            // prefix the URL path with fwd slash if it's missing
            if (Array.from(path)[0] !== '/') {
                path =`/${path}`;
            }
        }
        

        else if ( path instanceof SQLPassThruFilter) {
            path = path.endpoint;
        }

        else {
            throw TypeError(SDB_SPTQ_INVALID_PATH_TYPE);
        }

        endpoint = (endpoint + path).replaceAll('//','/');
        return this.sdbClient.host + endpoint;
    }
}

export { SQLPassThruQuery, SQLPassThruQueryList }