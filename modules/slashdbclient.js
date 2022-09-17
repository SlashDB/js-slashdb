import { DataDiscoveryDatabase } from './datadiscovery.js'
import { BaseRequestHandler as SDBConfig } from './baserequesthandler.js';

const SDB_SDBC_INVALID_HOSTNAME = 'Invalid hostname parameter, must be string';
const SDB_SDBC_INVALID_USERNAME = 'Invalid username parameter, must be string';
const SDB_SDBC_INVALID_APIKEY = 'Invalid apiKey parameter, must be string';

class SlashDBClient {
    constructor(host, username, apiKey) {

      if (!host || typeof(host) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_HOSTNAME);

      }

      if (!username || typeof(username) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_USERNAME);

      }

      if (!apiKey || typeof(apiKey) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_APIKEY);

      }

      this.host = host;
      this.username = username
      this.apiKey = apiKey;
      this.headers = { apikey: this.apiKey }
      this.isAuthenticatedFlag = false;

      // create the special case BaseRequestHandler object for interacting with config endpoints
      this.sdbConfig = new SDBConfig(this);

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

    async login() {
      
      const body = { login: this.username, password: this.password };
      try {
        let response = (await this.sdbConfig.post(body, this.loginEP)).res
        if (response.ok === true) {
          this.isAuthenticatedFlag = true;
        }
      }
      catch(e) {
        this.isAuthenticatedFlag = false;
      }
    }

    async isAuthenticated() {
      const url = `${this.userEP}/${this.username}.json`;
      
      try {
        let response = (await this.sdbConfig.get(url)).res
        if (response.ok === true) {
          this.isAuthenticatedFlag = true;
          return true;
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

    // explore databases on system
    async getDatabases() {
      const databases = {};
      let dbList = await this.getReflectStatus();
      for (const db in dbList) {
        databases[db] = new DataDiscoveryDatabase(this, db);
      }
      return databases;
    }

}


export { SlashDBClient }
