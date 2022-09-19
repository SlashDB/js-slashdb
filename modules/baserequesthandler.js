import { fetchWrapper } from './fetchwrapper.js';
import { SlashDBClient } from './slashdbclient.js';

const SDB_BRH_NO_CLIENTOBJ = 'clientObj missing or not valid SlashDBClient object';
const SDB_BRH_INVALID_CONTENT_TYPE = 'Invalid Content-Type header; acceptable values are json,csv,xml,xsd,html';
const SDB_BRH_INVALID_ACCEPT_TYPE = 'Invalid Accept header; acceptable values are json,csv,xml,xsd,html';
const SDB_BRH_INVALID_DATA = 'Data for POST/PUT body missing';
const SDB_BRH_INVALID_HEADER_OBJ = 'Invalid header parameter - must be an object containing key/value pairs';
const SDB_BRH_INVALID_HEADER_VALUE = 'Invalid header value - must be string or number';

class BaseRequestHandler {

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
    }

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
    }

    // for setting custom headers in HTTP request
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
            throw ReferenceError(SDB_BRH_INVALID_DATA)
        }        

        const url = this.buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this.acceptHeader,
            'Content-Type': this.contentTypeHeader,
            ...this.extraHeaders            
        };        

        return fetchWrapper('POST', url, data, headers);
    }

    async put(path, data) {
        if (!data) {
            throw ReferenceError(SDB_BRH_INVALID_DATA)
        }    

        const url = this.buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this.acceptHeader,
            'Content-Type': this.contentTypeHeader,
            ...this.extraHeaders       
        };        

        return fetchWrapper('PUT', url, data, headers);
    }    

    async delete(path) {
        const url = this.buildEndpointString(path);
        const headers = { 
            apiKey: this.sdbClient.apiKey, 
            Accept: this.acceptHeader,
            ...this.extraHeaders            
        };

        return fetchWrapper('DELETE', url, undefined, headers);
    }

    buildEndpointString(path) {

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
        
        endpoint = (endpoint + path).replaceAll('//','/');
        return this.sdbClient.host + endpoint;
    }

}

export { BaseRequestHandler }