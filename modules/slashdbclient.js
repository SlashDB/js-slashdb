import { DataDiscoveryDatabase } from './datadiscovery.js'
import { SQLPassThruQuery } from './sqlpassthru.js'
import { BaseRequestHandler } from './baserequesthandler.js';

const SDB_SDBC_INVALID_HOSTNAME = 'Invalid hostname parameter, must be string';
const SDB_SDBC_INVALID_USERNAME = 'Invalid username parameter, must be string';
const SDB_SDBC_MISSING_AUTH = 'API key or password must be provided';
const SDB_SDBC_INVALID_APIKEY = 'Invalid apiKey parameter, must be string';
const SDB_SDBC_INVALID_PASSWORD = 'Invalid password parameter, must be string';

/** 
 * Stores parameters necessary to communicate with a SlashDB instance and provides methods for retrieving metadata from the instance.
 */
class SlashDBClient {

  /** 
   * Creates a SlashDB client to connect to a SlashDB instance. 
   * @param {string} host - hostname/IP address of the SlashDB instance, including protocol and port number (e.g. http://192.168.1.1:8080)
   * @param {string} username - SlashDB username to use when connecting to instance
   * @param {string} apiKey - API key associated with username; set to null if using password
   * @param {string} [password] - password associated with username; if API key also provided, API key will be used for connection
   */
  constructor(host, username, apiKey, password = undefined) {

    if (!host || typeof(host) !== 'string') {
      throw TypeError(SDB_SDBC_INVALID_HOSTNAME);

    }

    if (!username || typeof(username) !== 'string') {
      throw TypeError(SDB_SDBC_INVALID_USERNAME);

    }

    if (!apiKey && !password) {
      throw ReferenceError(SDB_SDBC_MISSING_AUTH);
    }

    if (apiKey && typeof(apiKey) !== 'string') {
      throw TypeError(SDB_SDBC_INVALID_APIKEY);
    }

    if (password && typeof(password) !== 'string') {
      throw TypeError(SDB_SDBC_INVALID_PASSWORD);
    }

    if (apiKey && password) {
      console.warn('API key and password provided, using API key');
      password = undefined;
    }

    this.host = host;
    this.username = username
    this.apiKey = apiKey;
    this.password = password;
    this.isAuthenticatedFlag = false;

    // create the special case BaseRequestHandler object for interacting with config endpoints
    this.sdbConfig = new BaseRequestHandler(this);

    // SlashDB config endpoints
    this.loginEP = '/login';
    this.settingsEP = '/settings.json';
    this.versionEP = '/version.txt';
    this.licenseEP = '/license';
    this.loadEP = '/load-model';
    this.unloadEP = '/unload-model';
    this.checkDBConnEP = '/settings/check-database-connection.json';
    this.reflectStatusEP = '/settings/reflect-status.json';
    this.userEP = '/userdef';       
    this.dbDefEP = '/dbdef';        
    this.queryDefEP = '/querydef';  
              
  }

  /**
   * Logs in to SlashDB instance.  Only required when using password-based login.
   * @returns {true} true - on successful login
   * @throws {Error} e - on invalid login or error in login process
   */
  async login() {
    
    const body = { login: this.username, password: this.password };
    try {
      let response = (await this.sdbConfig.post(body, this.loginEP)).res
      if (response.ok === true) {
        this.isAuthenticatedFlag = true;
        return this.isAuthenticatedFlag;
      }
      else {
        this.isAuthenticatedFlag = false;
        return false;
      }
    }
    catch(e) {
      this.isAuthenticatedFlag = false;
      throw Error(e);
    }
  }

  /**
   * Checks whether SlashDB client is authenticated against instance.  
   * @returns {bool} bool - to indicate if currently authenticated
   */  
  async isAuthenticated() {
    const url = `${this.userEP}/${this.username}.json`;
    
    try {
      let response = (await this.sdbConfig.get(url)).res
      if (response.ok === true) {
        this.isAuthenticatedFlag = true;
        return true;
      }
      else {
        this.isAuthenticatedFlag = false;
        return false;
      }
    }
    catch(e) {
      this.isAuthenticatedFlag = false;
      return false;
    }
  }

      /* *** configuration endpoint getters/setters */

    async getSettings() {
      return (await this.sdbConfig.get(this.settingsEP)).data
    }

    async getVersion() {
   		return (await this.sdbConfig.get(this.versionEP)).data;
   	}

    async loadModel(dbName) {
 	  	return (await this.sdbConfig.get(`${this.loadEP}/${dbName}`)).data;
   	}

    async unloadModel(dbName) {
      return (await this.sdbConfig.get(`${this.unloadEP}/${dbName}`)).data;
    }

    async getReflectStatus(dbName = undefined) {
 		  const ep = (!dbName) ? this.reflectStatusEP : `${this.reflectStatusEP.split('.json')[0]}/${dbName}.json`;
 		  return (await this.sdbConfig.get(ep)).data;
 	  }

    async getUser(username = undefined) {
   		const ep = (!username) ? this.userEP : `${this.userEP}/${username}`;
    	return (await this.sdbConfig.get(ep)).data;
 	  }

    async getDbDef(dbName = undefined, guiData = false) {
      const guiParam = guiData ? '?guidata' : '';
      const ep = (!dbName) ? `${this.dbDefEP}${guiParam}` : `${this.dbDefEP}/${dbName}${guiParam}`;
      return (await this.sdbConfig.get(ep)).data;
    }  

 	  async getQueryDef(queryName = undefined, guiData = false) {
   		const guiParam = guiData ? '?guidata' : '';
   		const ep = (!queryName) ? `${this.queryDefEP}${guiParam}` : `${this.queryDefEP}/${queryName}${guiParam}`;
   		return (await this.sdbConfig.get(ep)).data;
   	}	    

  /**
   * Retrieve a list of databases that are configured on the SlashDB instance
   * @returns {Object} databases - a key/value pair object keyed by database name, with
   * a corresponding DataDiscoveryDatabase object for each key
   */
  async getDatabases() {
    const databases = {};
    let dbList = await this.getReflectStatus();
    for (const db in dbList) {
      databases[db] = new DataDiscoveryDatabase(this, db);
    }
    return databases;
  }

  /**
   * Retrieve a list of SQL Pass-Thru queries that are configured on the SlashDB instance
   * @param {string} [dbName] - database name; if specified, will only return queries associated with the given database
   * @returns {Object} queries - a key/value pair object keyed by query ID, with
   * a corresponding SQLPassThruQuery object for each key
   */
  async getQueries(dbName = undefined) {
    let queryList = await this.getQueryDef();
    const queries = {};  

    
    // create a query object for each query in the list
    for (const query in queryList) {
        
        if (dbName) {
            if (queryList[query]['database'] !== dbName) {
                continue;
            }
        }
        
        // required since url_template is not included when getQueryDef returns all queries, only for individual ones
        const q = await this.getQueryDef(query);  

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


export { SlashDBClient }
