import { fetchWrapper } from './fetchwrapper.js';
import { SlashDBClient } from './slashdbclient.js';

const SDB_BRH_NO_CLIENTOBJ = 'clientObj missing or not valid SlashDBClient object';
const SDB_BRH_INVALID_CONTENT_TYPE = 'Invalid Content-Type header; acceptable values are json,csv,xml,xsd,html';
const SDB_BRH_INVALID_ACCEPT_TYPE = 'Invalid Accept header; acceptable values are json,csv,xml,xsd,html';
const SDB_BRH_INVALID_DATA = 'Data for POST/PUT body missing';
const SDB_BRH_INVALID_HEADER_OBJ = 'Invalid header parameter - must be an object containing key/value pairs';
const SDB_BRH_INVALID_HEADER_VALUE = 'Invalid header value - must be string or number';

/** 
 * Executes HTTP requests for SlashDB.  Base class for `DataDiscoveryResource` and `SQLPassThruQuery` classes.
 */
class BaseRequestHandler {

   /**
   * Create a `BaseRequestHandler` object for a given SlashDB instance
   * @param {SlashDBClient} [clientObj] - a configured `SlashDBClient` object
   */
    constructor(clientObj = null) {

        if (clientObj instanceof SlashDBClient) {
            this.sdbClient = clientObj;
        }

        // else {
        //     throw ReferenceError(SDB_BRH_NO_CLIENTOBJ);
        // }

        this.validMimeTypes = {
            json: 'application/json',
            csv: 'text/csv',
            xml: 'application/xml',
            xsd: 'text/xsd',
            html: 'text/html'
        }

        this.acceptHeader = this.validMimeTypes.json;
        this.contentTypeHeader = this.validMimeTypes.json;
        this.extraHeaders = {};

    }

   /**
   * Sets Accept header value for HTTP requests
   * @param {string} format - a valid MIME type (e.g. `'application/json'`), or a key value of the validMimeTypes property in this class (e.g. `'json','csv'`)
   * @throws {TypeError} if format missing
   * @throws {TypeError} if format is not string
   * @returns {BaseRequestHandler} this object
   */
    accept(format) {
        if (!format) {
            throw TypeError(SDB_BRH_INVALID_ACCEPT_TYPE);
        }

        if (typeof(format) !== 'string') {
            throw TypeError(SDB_BRH_INVALID_ACCEPT_TYPE);
        }
        
        format = format.toLowerCase()

        if (this.validMimeTypes.hasOwnProperty(format)) {
            this.acceptHeader = this.validMimeTypes[format];
            return this;
        }

        else {
            this.acceptHeader = format;

            for (const ct in this.validMimeTypes) {
                if (this.validMimeTypes[ct] === format) {
                    return this;
                }
            }

            console.warn(`Accept-Type '${format}' unknown`);
        }
        return this;        
    }

   /**
   * Sets Content-Type header value for HTTP POST/PUT requests
   * @param {string} format - a valid MIME type (e.g. `'application/json'`), or a key value of the validMimeTypes property in this class (e.g. `'json','csv'`)
   * @throws {TypeError} if format missing
   * @throws {TypeError} if format is not string
   * @returns {BaseRequestHandler} this object
   */    
    contentType(format) {
        if (!format) {
            throw TypeError(SDB_BRH_INVALID_CONTENT_TYPE);
        }

        if (typeof(format) !== 'string') {
            throw TypeError(SDB_BRH_INVALID_CONTENT_TYPE);
        }
        
        format = format.toLowerCase()

        if (this.validMimeTypes.hasOwnProperty(format)) {
            this.contentTypeHeader = this.validMimeTypes[format];
            return this;
        }

        else {
            this.contentTypeHeader = format;

            for (const ct in this.validMimeTypes) {
                if (this.validMimeTypes[ct] === format) {
                    return this;
                }
            }

            console.warn(`Content-Type '${format}' unknown`);
        }
        return this;
    }

   /**
   * Sets arbitrary custom header value for HTTP requests
   * @param {object} headersObj - an object containing key/value pairs of header properties
   * @throws {TypeError} `headersObj` is not an object
   * @throws {TypeError} if the value of a key/value pair is not a string or number
   * @returns {BaseRequestHandler} this object
   */
    setExtraHeaders(headerObj) {
        if (typeof(headerObj) === 'object' && !Array.isArray(headerObj) && headerObj !== null) {
            for (const key in headerObj) {
                if (typeof(headerObj[key]) !== 'string' && typeof(headerObj[key]) !== 'number') {
                    throw TypeError(SDB_BRH_INVALID_HEADER_VALUE);
                }

                this.extraHeaders[key] = headerObj[key];
            }
        }
        else {
            throw TypeError(SDB_BRH_INVALID_HEADER_OBJ);
        }
        return this;        
    }

   /**
   * Executes HTTP GET request
   * @param {string | DataDiscoveryFilter | SQLPassThruFilter} [path] - an optional string containing a URI segment with URL query parameters 
     * (e.g. `/Customer/FirstName/Tim?distinct=true`), or a `DataDiscoveryFilter/SQLPassThruFilter` object that contains all the query details 
   * @returns {Promise} promise containing HTTP response status and data
   */    
    async get(path) {
        const url = this._buildEndpointString(path);

        let headers = {};
        if (this.sdbClient.apiKey) {
            headers = { 
                apiKey: this.sdbClient.apiKey, 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        } else if (this.sdbClient.basic) {
            headers = { 
                Authorization: "Basic " + this.sdbClient.basic, 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        } else if (this.sdbClient.ssoCredentials) {
            const token = btoa(this.sdbClient.ssoCredentials.id_token)
            headers = { 
                Authorization: "Bearer " + token,
                "X-Identity-Provider-Id": this.sdbClient.idpId, 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        } else {
            headers = { 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        }

        return fetchWrapper('GET', url, undefined, headers);
    }


   /**
   * Executes HTTP POST request
   * @param {string | object} data - an object or string containing data values to include in the POST request body.  Can be JSON, an object, or CSV/XML formatted string
   * @param {string | DataDiscoveryFilter | SQLPassThruFilter} [path] - an optional string containing a URI segment with URL query parameters 
     * (e.g. `/Customer/FirstName/Tim?distinct=true`), or a `DataDiscoveryFilter/SQLPassThruFilter` object that contains all the query details.  Not used under normal
     * circumstances.
   * @returns {Promise} promise containing HTTP response status and data
   */  

    // path here is handled slightly differently since it would not be common to specify;
    // used in SlashDBClient's config methods
    async post(data, path = undefined) {
        if (!data) {
            throw ReferenceError(SDB_BRH_INVALID_DATA)
        }        

        const url = this._buildEndpointString(path);

        let headers = {};
        if (this.sdbClient.apiKey) {
            headers = { 
                apiKey: this.sdbClient.apiKey, 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        } else if (this.sdbClient.basic) {
            headers = { 
                Authorization: "Basic " + this.sdbClient.basic, 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        } else if (this.sdbClient.ssoCredentials) {
            const token = btoa(this.sdbClient.ssoCredentials.id_token)
            headers = { 
                Authorization: "Bearer " + token,
                "X-Identity-Provider-Id": this.sdbClient.idpId,
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        } else {
            headers = { 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        }

        return fetchWrapper('POST', url, data, headers);
    }


   /**
   * Executes HTTP PUT request
   * @param {string | object} data - an object or string containing data values to include in the PUT request body.  Can be JSON, an object, or CSV/XML formatted string
   * @param {string | DataDiscoveryFilter | SQLPassThruFilter | null | undefined} path - a string containing a URI segment with URL query parameters 
     * (e.g. `/Customer/FirstName/Tim?distinct=true`), or a `DataDiscoveryFilter/SQLPassThruFilter` object that contains all the query details.  Set to null or undefined
     * if not required.
   * @returns {Promise} promise containing HTTP response status and data
   */      
    async put(path, data) {
        if (!data) {
            throw ReferenceError(SDB_BRH_INVALID_DATA)
        }    

        const url = this._buildEndpointString(path);

        let headers = {};
        if (this.sdbClient.apiKey) {
            headers = { 
                apiKey: this.sdbClient.apiKey, 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        } else if (this.sdbClient.basic) {
            headers = { 
                Authorization: "Basic " + this.sdbClient.basic, 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        } else if (this.sdbClient.ssoCredentials) {
            const token = btoa(this.sdbClient.ssoCredentials.id_token)
            headers = { 
                Authorization: "Bearer " + token,
                "X-Identity-Provider-Id": this.sdbClient.idpId,
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        } else {
            headers = { 
                Accept: this.acceptHeader,
                'Content-Type': this.contentTypeHeader,
                ...this.extraHeaders
            };
        }

        return fetchWrapper('PUT', url, data, headers);
    }    

   /**
   * Executes HTTP DELETE request
   * @param {string | DataDiscoveryFilter | SQLPassThruFilter} [path] - an optional string containing a URI segment with URL query parameters 
     * (e.g. `/Customer/FirstName/Tim?distinct=true`), or a `DataDiscoveryFilter/SQLPassThruFilter` object that contains all the query details 
   * @returns {Promise} promise containing HTTP response status and data
   */       
    async delete(path) {
        const url = this._buildEndpointString(path);
        
        let headers = {};
        if (this.sdbClient.apiKey) {
            headers = { 
                apiKey: this.sdbClient.apiKey, 
                Accept: this.acceptHeader,
                ...this.extraHeaders
            };
        }
        else {
            headers = { 
                Accept: this.acceptHeader,
                ...this.extraHeaders
            };
        }

        return fetchWrapper('DELETE', url, undefined, headers);
    }


    /**
     * Builds the full endpoint to the requested resource.  Meant for internal use only.  Overloaded in `DataDiscoveryResource/SQLPassThruQuery`
     * @param {string} [path] - an optional string containing a URI segment with SQL query parameters/values and URL query parameters 
     * (e.g. `/FirstName/Tim?distinct=true`)
     * @returns {string} the full endpoint
     * @throws {ReferenceError} if no `SlashDBClient` object is found attached to this object
     * @throws {SyntaxError} if path parameter is an empty string
     * @throws {TypeError} if path parameter is neither a string or a `SQLPassThruFilter` object
     */    
    _buildEndpointString(path) {

        if (! this.sdbClient || ! (this.sdbClient instanceof SlashDBClient)) {
            throw ReferenceError(SDB_BRH_NO_CLIENTOBJ);
        }

        let endpoint = '';
        
        if (!path) {
            return this.sdbClient.host + endpoint;
        }
        
        if (typeof(path) === 'string') {
            if (path.trim().length < 1) {
                throw SyntaxError(SDB_SPT_INVALID_PATH_EMPTY);
            }

            // prefix the URL path with fwd slash if it's missing
            if (Array.from(path)[0] !== '/') {
                path =`/${path}`;
            }
        }
        else {
            throw TypeError(SDB_SPT_INVALID_PATH_EMPTY);
        }
        
        return this.sdbClient.host + endpoint + path;
    }

}

export { BaseRequestHandler }