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
                this.dbName = `${db.dbName}/`;  
            }
            else if (typeof(db) === 'string') {
                this.dbName = `${db}/`;
            }
            else {
                throw TypeError(SDB_DDR_NO_DB);
            }

            // resourceName is always a string
            if (typeof(resourceName) !== 'string' || resourceName.trim().length < 1) {
                throw TypeError(SDB_DDR_NO_RESOURCE);
            }

            this.dbPrefix = '/db/'
            this.resourceName = `${resourceName}`;
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

        this._acceptHeader = this.validMimeTypes.json;
        this._contentTypeHeader = this.validMimeTypes.json;
        this._extraHeaders = {};

    }

    accept(format) {
        if (!format) {
            throw TypeError(SDB_DDR_INVALID_ACCEPT_TYPE);
        }

        if (this.validMimeTypes.hasOwnProperty(format)) {
            this._acceptHeader = this.validMimeTypes[format];
  
        }
        else {
            for (const type in this.validMimeTypes) {
                if (this.validMimeTypes[type] === format.toLowerCase()) {
                    this._acceptHeader= this.validMimeTypes[type];
                    break;
                }
            }
            throw TypeError(SDB_DDR_INVALID_ACCEPT_TYPE);
        }

        return this;
    }

    contentType(format) {
        if (!format) {
            throw TypeError(SDB_DDR_INVALID_ACCEPT_TYPE);
        }

        if (this.validMimeTypes.hasOwnProperty(format)) {
            this._contentTypeHeader = this.validMimeTypes[format];
  
        }
        else {
            for (const type in this.validMimeTypes) {
                if (this.validMimeTypes[type] === format.toLowerCase()) {
                    this._contentTypeHeader= this.validMimeTypes[type];
                    break;
                }
            }
            throw TypeError(SDB_DDR_INVALID_CONTENT_TYPE);
        }

        return this;
    }

    // for setting custom headers in HTTP request
    extraHeaders(key,value) {
        if (typeof(key) !== 'string' && typeof(key) !== 'number') {
            throw TypeError(SDB_DDR_INVALID_HEADER_KEY);
        }
        if (typeof(value) !== 'string' && typeof(value) !== 'number') {
            throw TypeError(SDB_DDR_INVALID_HEADER_VALUE);
        }

        this._extraHeaders[key] = value;
    }

    async get(path) {
        const url = this.#buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this._acceptHeader,
            ...this._extraHeaders
        };

        return fetchWrapper('GET', url, undefined, headers);
    }

    async post(data) {
        if (!data) {
            throw ReferenceError(SDB_DDR_INVALID_DATA)
        }        

        const url = this.#buildEndpointString();
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this._acceptHeader,
            'Content-Type': this._contentTypeHeader,
            ...this._extraHeaders            
        };        

        return fetchWrapper('POST', url, data, headers);
    }

    async put(path, data) {
        if (!data) {
            throw ReferenceError(SDB_DDR_INVALID_DATA)
        }    

        const url = this.#buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this._acceptHeader,
            'Content-Type': this._contentTypeHeader,
            ...this._extraHeaders       
        };        

        return fetchWrapper('PUT', url, data, headers);
    }    

    async delete(path) {
        const url = this.#buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this._acceptHeader,
            ...this._extraHeaders            
        };

        return fetchWrapper('DELETE', url, undefined, headers);
    }


    #buildEndpointString(path) {

        let endpoint = this.sdbClient.host + this.dbPrefix + this.dbName + this.resourceName;
        
        // if no path is provided, the HTTP operation will act on all entries of the resource
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
            path = path.filterString;
        }

        else {
            throw TypeError(SDB_DDR_INVALID_PATH_TYPE);
        }

        return endpoint + path;
    }
}

export { DataDiscoveryResource, DataDiscoveryDatabase }