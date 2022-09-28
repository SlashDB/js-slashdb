import { SlashDBClient } from './slashdbclient.js';
import { SQLPassThruFilter } from './sqlpassthrufilter.js';
import { BaseRequestHandler } from './baserequesthandler.js';

const SDB_SPTQ_NO_CLIENTOBJ = 'Parameter clientObj missing or not valid SlashDBClient object';
const SDB_SPTQ_INVALID_QUERYNAME = 'Parameter queryName must be a non-empty string';
const SDB_SPTQ_INVALID_PATH_EMPTY = 'Empty path given';
const SDB_SPTQ_INVALID_PATH_TYPE = 'Path is not a string or a DataDiscoveryFilter object';

/** 
 * Executes HTTP requests for SlashDB SQL Pass-Thru functionality.  Extends the BaseRequestHandler class
 * for most methods.
 */
class SQLPassThruQuery extends BaseRequestHandler {

   /**
   * Create a SQLPassThruQuery object for a given SlashDB instance
   * @extends BaseRequestHandler
   * @param {string} queryID - ID of the query to execute, as registered in the SlashDB instance
   * @param {SlashDBClient} clientObj - a configured SlashDBClient object
   * @param {Object} [methods] - optional object of key/value pairs specifying which HTTP methods the query supports (e.g. {GET:true, POST:false})
   * @param {Object} [params] - optional array of strings specifying names of parameters (e.g. ['FirstName','LastName'])
   * @throws {TypeError} if queryID not a string
   * @throws {SyntaxError} if queryID contains '/' character
   * @throws {SyntaxError} if queryID contains spaces or parses to number
   */
    constructor(queryID, clientObj, methods=null, params=null) {
        super(clientObj)

		if (typeof(queryID) !== 'string' || queryID.trim().length < 1) {
			throw TypeError(SDB_SPTQ_INVALID_QUERYNAME);
		}
		if (queryID.indexOf('/') !== -1) {
			throw SyntaxError(SDB_SPTQ_INVALID_QUERYNAME);
		}

		if (!isNaN(parseInt(queryID)) || queryID.indexOf(' ') !== -1) {
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

        this.queryName = queryID;
        this.queryPrefix = '/query/';

    }

    /**
     * Builds the full endpoint to the requested resource.  Meant for internal use only.
     * @param {string | SQLPassThruFilter} [path] - an optional string containing a URI fragment with SQL query parameters/values and URL query parameters 
     * (e.g. /FirstName/Tim?distinct=true), or a SQLPassThruFilter object that contains all the query details
     * @returns {string} the full endpoint
     * @throws {ReferenceError} if no SlashDBClient object is found attached to this object
     * @throws {SyntaxError} if path parameter is an empty string
     * @throws {TypeError} if path parameter is neither a string or a SQLPassThruFilter object
     */
    _buildEndpointString(path) {

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

export { SQLPassThruQuery }