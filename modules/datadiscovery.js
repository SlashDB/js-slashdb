import { DataDiscoveryFilter } from './datadiscoveryfilter.js';
import { BaseRequestHandler } from './baserequesthandler.js';
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
const SDB_DDR_INVALID_PATH_EMPTY = 'Empty path given';
const SDB_DDR_INVALID_PATH_TYPE = 'Path is not a string or a DataDiscoveryFilter object';

class DataDiscoveryResource extends BaseRequestHandler {
    
    constructor(db, resourceName, clientObj) {
        super(clientObj);

        // db parameter can be a string or a DataDiscoveryDatabase
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

        // if no client object explicity given, the client object must be in the db parameter,
        // which must be a DataDiscoveryDatabase object in order to proceed
        if (!clientObj) {
            if (! (db instanceof DataDiscoveryDatabase)) {
                throw ReferenceError(SDB_DDR_NO_DB);
            }
            if (!db.sdbClient || !(db.sdbClient instanceof SlashDBClient)) {
                throw ReferenceError(SDB_DDR_NO_CLIENTOBJ);    
            }
            this.sdbClient = db.sdbClient;
        }

    }

    buildEndpointString(path) {

        if (! this.sdbClient || ! (this.sdbClient instanceof SlashDBClient)) {
            throw ReferenceError(SDB_DDR_NO_CLIENTOBJ);
        }

        let endpoint = this.dbPrefix + `${this.dbName}/` + this.resourceName;
        
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

        endpoint = (endpoint + path).replaceAll('//','/');
        return this.sdbClient.host + endpoint;
    }
}

export { DataDiscoveryResource, DataDiscoveryDatabase }