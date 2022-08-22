import { fetchWrapper } from './fetchwrapper.js';

class DataDiscoveryHandler {
    constructor(dbName, host, username, apiKey, sdbConfigObj = false) {
        
        this.host = host;
        this.username = username;
        this.apiKey = apiKey;
        this.acceptHeader = 'application/json';
        this.contentTypeHeader = 'application/json';

        this.headers = { apikey: this.apiKey }

        // for normal data discovery operations
        if (!sdbConfigObj) {
            this.dbName = `${dbName}/`;
            this.dbPrefix = '/db/'
        }

        // if creating the internal config object used by slashdbclient,
        // just make the dbName and dbPrefix blank strings so that the 
        // special URLs used in config operations are handled properly
        else {
            this.dbName = '';
            this.dbPrefix = '';
        }
    }

    setDatabase(dbName) {
        this.dbName = dbName;
    }

    accept(format) {
        //
    }

    contentType(format) {
        //
    }

    extraHeaders(headers) {
        //
    }

    async get(urlPath) {
        const url = this.host + this.dbPrefix + this.dbName + urlPath
        return fetchWrapper('GET', url, undefined, this.headers);
    }

    async post(url) {
        //
    }

    async put(url) {
        //
    }    

    async delete(url) {
        //
    }
    
}

export { DataDiscoveryHandler }