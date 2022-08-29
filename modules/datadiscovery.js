import { fetchWrapper } from './fetchwrapper.js';

class DataDiscoveryDatabase {
    constructor(clientObj, dbName) {
        this.sdbClient = clientObj;
        this.dbName = dbName;

    }

    // explore resources in DB
    async getDataDiscoveryResources() {
        let db = await this.sdbClient.getReflectStatus(this.dbName);
        const resources = {};  
        if (db.model !== 'Connected') {
            console.log(`database ${this.dbName} is not connected`);
            return;
        }
        for (const resource of db.tables) {
            resources[resource.table_name] = new DataDiscoveryResource(this.dbName, resource.table_name, this.sdbClient); //new DataDiscovery(dbName, this);
        }
        
        return resources;
    }

}

class DataDiscoveryResource {
    constructor(db, resourceName, clientObj, sdbConfigObj = false) {
        if (clientObj !== undefined) {
            this.sdbClient = clientObj;
        }
        else if (typeof(db) === 'object') {
            this.sdbClient = db.sdbClient
        }
        else {
            throw ReferenceError('missing clientObj/db object');
        }

        // for normal data discovery operations
        if (!sdbConfigObj) {
            if (typeof(db) === 'object') {
                this.dbName = `${db.dbName}/`;    
            }
            else {
                this.dbName = `${db}/`;
            }

            this.dbPrefix = '/db/'
            this.resourceName = `${resourceName}`;
        }

        // if creating the internal config object used by slashdbclient,
        // just set these properties to blank strings so that the 
        // special URLs used in config operations are handled properly
        else {
            this.dbPrefix = '';
            this.dbName = '';
            this.resourceName = '';
        }

        this._acceptHeader = 'application/json';
        this.contentTypeHeader = 'application/json';

        this.validAcceptTypes = {
            json: 'application/json',
            csv: 'text/csv',
            xml: 'application/xml',
            xsd: 'text/xsd',
            html: 'text/html'
        }

    }

    accept(format) {
        if (this.validAcceptTypes.hasOwnProperty(format)) {
            this._acceptHeader = this.validAcceptTypes[format];
  
        }
        else {
            for (const type in this.validAcceptTypes) {
                if (this.validAcceptTypes[type] === format.toLowerCase()) {
                    this._acceptHeader= this.validAcceptTypes[type];
                    break;
                }
            }
            throw SyntaxError('INVALID ACCEPT TYPE')
        }

        return this;
    }

    contentType(format) {
        //
    }

    extraHeaders(headers) {
        //
    }

    async get(urlPath) {

        // prefix the URL path with fwd slash if it's missing
        if (typeof(urlPath) === 'string') {
            if (Array.from(urlPath)[0] !== '/') {
                urlPath =`/${urlPath}`;
            }
        }
        
        else if (typeof(urlPath) === 'object' && urlPath !== null) {
            if ( urlPath.hasOwnProperty('filterString')) {
                urlPath = urlPath.filterString;
            }
        }

        const url = this.sdbClient.host + this.dbPrefix + this.dbName + this.resourceName + urlPath;
        const headers = Object.assign({}, this.sdbClient);
        headers['Accept'] = this._acceptHeader;
        return await fetchWrapper('GET', url, undefined, headers);
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

export { DataDiscoveryResource, DataDiscoveryDatabase }