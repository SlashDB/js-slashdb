import { fetchWrapper } from './fetchwrapper.js';
import { DataDiscoveryFilter } from './datadiscoveryfilter.js';
import { SlashDBClient } from './slashdbclient.js';

const SDB_DDD_NO_CLIENTOBJ = 'Parameter clientObj missing or not valid SlashDBClient object';
const SDB_DDD_NO_DB = 'Parameter db must be a string';

class DataDiscoveryDatabase {
    constructor(clientObj, dbName) {
        
        if (!clientObj || !(clientObj instanceof SlashDBClient)) {
            throw ReferenceError(SDB_DDD_NO_CLIENTOBJ);
        }

        if (!dbName || typeof(dbName) !== 'string') {
            throw ReferenceError(SDB_DDD_NO_DB);
        }

        this.sdbClient = clientObj;
        this.dbName = dbName;

    }

    // explore resources in DB
    async getDataDiscoveryResources() {
        let db = await this.sdbClient.getReflectStatus(this.dbName);
        const resources = {};  
        if (db.model !== 'Connected') {
            console.log(`Database ${this.dbName} is not connected`);
            return;
        }
        for (const resource of db.tables) {
            resources[resource.table_name] = new DataDiscoveryResource(this.dbName, resource.table_name, this.sdbClient); 
        }
        
        return resources;
    }

}

const SDB_DDR_NO_CLIENTOBJ = 'Parameter clientObj missing or not valid SlashDBClient object';
const SDB_DDR_NO_RESOURCE = 'Parameter resourceName must be a string';
const SDB_DDR_NO_DB = 'Parameter db must be a string or a DataDiscoveryDatabase object';
const SDR_DDR_NO_DB_NAME = 'DataDiscoveryDatabase object missing/invalid parameter dbName, must be string';
const SDB_DDR_INVALID_CONTENT_TYPE = 'Invalid Content-Type header; acceptable values are json,csv,xml,xsd,html';
const SDB_DDR_INVALID_ACCEPT_TYPE = 'Invalid Accept header; acceptable values are json,csv,xml,xsd,html';
const SDB_DDR_INVALID_PATH_EMPTY = 'Empty path given';
const SDB_DDR_INVALID_PATH_TYPE = 'Path is not a string or a DataDiscoveryFilter object';
const SDB_DDR_INVALID_DATA = 'Data for POST/PUT body missing';
const SDB_DDR_INVALID_HEADER_OBJ = 'Invalid header parameter - must be an object containing key/value pairs';
const SDB_DDR_INVALID_HEADER_KEY = 'Invalid header key - must be string or number';
const SDB_DDR_INVALID_HEADER_VALUE = 'Invalid header value - must be string or number';


class DataDiscoveryResource {

    constructor(db, resourceName, clientObj, sdbConfigObj = false) {

        // if creating the internal config object used by slashdbclient,
        // just set these properties to blank strings so that the 
        // special URLs used in config operations are handled properly
        if (sdbConfigObj) {
            this.dbPrefix = '';
            this.dbName = '';
            this.resourceName = '';            
        }

        // for regular use, db parameter can be a string or a DataDiscoveryDatabase
        else {
            if (db instanceof DataDiscoveryDatabase) {
                if (!db.dbName || typeof(db.dbName) !== 'string') {
                    throw ReferenceError(SDR_DDR_NO_DB_NAME);
                }
                if (!isNaN(db.dbName)) {
                    throw TypeError(SDR_DDR_NO_DB_NAME);
                }        

                this.dbName = db.dbName;  
            }
            else if (typeof(db) === 'string') {
                if (!isNaN(db)) {
                    throw TypeError(SDB_DDR_NO_DB);
                }                       
                this.dbName = db;
            }
            else {
                throw TypeError(SDB_DDR_NO_DB);
            }

            // resourceName is always a string
            if (typeof(resourceName) !== 'string' || resourceName.trim().length < 1) {
                throw TypeError(SDB_DDR_NO_RESOURCE);
            }

            if (!isNaN(resourceName)) {
                throw TypeError(SDB_DDR_NO_RESOURCE);
            }            

            this.dbPrefix = '/db/'
            this.resourceName = resourceName;
        }


        // if client object is explicitly given, must be a SlashDBClient object
        if (clientObj instanceof SlashDBClient) {
            this.sdbClient = clientObj;
        }

        // otherwise, the client object must be in the db parameter,
        // which must be a DataDiscoveryDatabase object in order to proceed
        else if (!clientObj) {
            if (! (db instanceof DataDiscoveryDatabase)) {
                throw ReferenceError(SDB_DDR_NO_DB);
            }
            if (!db.sdbClient || !(db.sdbClient instanceof SlashDBClient)) {
                throw ReferenceError(SDB_DDR_NO_CLIENTOBJ);    
            }
            this.sdbClient = db.sdbClient;
        }

        else {
            throw ReferenceError(SDB_DDR_NO_CLIENTOBJ);
        }


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

    accept(format) {
        if (!format) {
            throw TypeError(SDB_DDR_INVALID_ACCEPT_TYPE);
        }

        if (typeof(format) !== 'string') {
            throw TypeError(SDB_DDR_INVALID_ACCEPT_TYPE);
        }
        
        format = format.toLowerCase()
        
        if (this.validMimeTypes.hasOwnProperty(format)) {
            this.acceptHeader = this.validMimeTypes[format];
  
        }

        else {
            this.acceptHeader = format;
            console.warn('Accept type ${format} unknown');
        }

        return this;
    }

    contentType(format) {
        if (!format) {
            throw TypeError(SDB_DDR_INVALID_CONTENT_TYPE);
        }

        if (typeof(format) !== 'string') {
            throw TypeError(SDB_DDR_INVALID_CONTENT_TYPE);
        }
        
        format = format.toLowerCase()

        if (this.validMimeTypes.hasOwnProperty(format)) {
            this.contentTypeHeader = this.validMimeTypes[format];
  
        }

        else {
            this.contentTypeHeader = format;
            console.warn('Content-Type ${format} unknown');
        }

        return this;
    }

    // for setting custom headers in HTTP request
    setExtraHeaders(headerObj) {
        if (typeof(headerObj) === 'object' && !Array.isArray(headerObj) && headerObj !== null) {
            for (const key in headerObj) {
                if (typeof(headerObj[key]) !== 'string' && typeof(headerObj[key]) !== 'number') {
                    throw TypeError(SDB_DDR_INVALID_HEADER_VALUE);
                }

                this.extraHeaders[key] = headerObj[key];
            }
        }
        else {
            throw TypeError(SDB_DDR_INVALID_HEADER_OBJ);
        }
    }

    async get(path) {
        const url = this.buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this.acceptHeader,
            ...this.extraHeaders
        };

        return fetchWrapper('GET', url, undefined, headers);
    }

    // path here is handled slightly differently since it would not be common to specify;
    // used in SlashDBClient's config methods
    async post(data, path = undefined) {
        if (!data) {
            throw ReferenceError(SDB_DDR_INVALID_DATA)
        }        

        const url = this.buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this.acceptHeader,
            'Content-Type': this.contentTypeHeader,
            ...this.extraHeaders            
        };        

        return fetchWrapper('POST', url, data, headers, true);
    }

    async put(path, data) {
        if (!data) {
            throw ReferenceError(SDB_DDR_INVALID_DATA)
        }    

        const url = this.buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this.acceptHeader,
            'Content-Type': this.contentTypeHeader,
            ...this.extraHeaders       
        };        

        return fetchWrapper('PUT', url, data, headers, true);
    }    

    async delete(path) {
        const url = this.buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this.acceptHeader,
            ...this.extraHeaders            
        };

        return fetchWrapper('DELETE', url, undefined, headers, true);
    }


    buildEndpointString(path) {

        let endpoint = this.sdbClient.host + this.dbPrefix + `${this.dbName}/` + this.resourceName;
        
        // if no path is provided, the HTTP operation will act on all resource records
        if (!path) {
            return endpoint;
        }

        
        // path can be string or DataDiscoveryFilter object
        if (typeof(path) === 'string') {
            if (path.trim().length < 1) {
                throw SyntaxError(SDB_DDR_INVALID_PATH_EMPTY);
            }

            // prefix the URL path with fwd slash if it's missing
            if (Array.from(path)[0] !== '/') {
                path =`/${path}`;
            }
        }
        

        else if ( path instanceof DataDiscoveryFilter) {
            path = path.endpoint;
        }

        else {
            throw TypeError(SDB_DDR_INVALID_PATH_TYPE);
        }

        return endpoint + path;
    }
}

export { DataDiscoveryResource, DataDiscoveryDatabase }