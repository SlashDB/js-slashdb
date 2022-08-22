import { fetchWrapper } from './fetchwrapper.js';
import { DataDiscoveryHandler, DataDiscoveryHandler as SDBConfigHandler } from './datadiscovery.js';


/**
 * Set internal variables values for server connection. Once set, incoming options will be used for future interaction
 * with SlashDB. Options include server url, dataformat of response and API key to be used for validation.
 *
 * @param {String} baseUrlPath - Root path of slashdb server. Example http://localhost:8000.
 * @param {Object} setUpOptions - Setup options for use and connection to SlashDB server. Key value format.
 * @param {String} setUpOptions.dataFormatExt - Format of data. Json, XML, CSV, HTML, XSD.
 * @param {String} setUpOptions.apikey - API key for authentication purposes.
 */

class SlashDBClient {
    constructor(host, username, apiKey) {
      this.host = host;
      this.username = username
      this.apiKey = apiKey;
      this.headers = { apikey: this.apiKey }
      this.isAuthenticatedFlag = false;

      // create the special case DataDiscoveryHandler object for interacting with config endpoints
      this.sdbConfig = new SDBConfigHandler(undefined, this.host, this.username, this.apiKey, true);

      // SlashDB config endpoints
      this.settingsEP = '/settings.json';
      this.versionEP = '/version.txt';
      this.licenseEP = '/license';
      this.loadEP = '/load-model';
      this.unloadEP = '/unload-model';
      this.checkDBConnEP = '/settings/check-database-connection.json';
      this.reflectStatusEP = '/settings/reflect-status.json';
      this.userEP = '/userdef';       // user config endpoint
      this.dbDefEP = '/dbdef';        // database definitions endpoint
      this.queryDefEP = '/querydef';  // query definitions endpoint
                
    }

    async login() {
      //const temp = dataFormat; // comment out for now...work on this later
      const temp = 'json';    
      let dataFormat = '';
      const url = this.host + '/login';
      const body = { login: this.username, password: this.password };

      await fetchWrapper('POST', url, body, this.headers, true).then((res) => {
        if (res) {
          if (res.status === 200 || 304) {
              this.isAuthenticatedFlag = true;
            //setCookie('user_id', username);
          } else {
              this.isAuthenticatedFlag = false;
            //delete_cookie('user_id');
          }
        }
      });
      dataFormat = temp;
    }

    async isAuthenticated() {
      //const localUser = getCookie('user_id'); // comment out for now
      const url = this.host + `/userdef/${this.username}`;
      
      await fetchWrapper('GET', url, undefined, this.headers, true)
        .then((response) => {
          return response.status === 200;
        })
        .then((value) => {
          this.isAuthenticatedFlag = true;
        });
      //return getIsAuthenticated(); // comment out for now
      return true
    }

      /* *** configuration endpoint getters/setters */

    async getSettings() {
      return await this.sdbConfig.get(this.settingsEP)
    }

    async getVersion() {
   		const versionTxt = await this.sdbConfig.get(this.versionEP);
 	  	return {version : versionTxt}
   	}

    async loadModel(dbName) {
 	  	return await this.sdbConfig.get(`${this.loadEP}/${dbName}`);
   	}

    async unloadModel(dbName) {
      return await this.sdbConfig.get(`${this.unloadEP}/${dbName}`);
    }

    async getReflectStatus(dbName = undefined) {
 		  const ep = (!dbName) ? this.reflectStatusEP : `${this.reflectStatusEP.split('.json')[0]}/${dbName}.json`;
 		  return await  this.sdbConfig.get(ep);
 	  }

    async getUser(username = undefined) {
   		const ep = (!username) ? this.userEP : `${this.userEP}/${username}`;
    	return await this.sdbConfig.get(ep);
 	  }

    async getDbDef(dbName = undefined, guiData = false) {
      const guiParam = guiData ? '?guidata' : '';
      const ep = (!dbName) ? `${this.dbDefEP}${guiParam}` : `${this.dbDefEP}/${dbName}${guiParam}`;
      return await this.sdbConfig.get(ep);
    }  

 	  async getQueryDef(queryName = undefined, guiData = false) {
   		const guiParam = guiData ? '?guidata' : '';
   		const ep = (!queryName) ? `${this.queryDefEP}${guiParam}` : `${this.queryDefEP}/${queryName}${guiParam}`;
   		return await this.sdbConfig.get(ep);
   	}	    

    /**
    * Creates a new DataDiscoveryHandler object
    *
    * @param {String} databaseName - name of the database this DataDiscoveryHandler object will interact with
    * @returns {DataDiscoveryHandler} - a DataDiscoveryHandler object
    */
    dataDiscoveryFactory(databaseName) {
      return new DataDiscoveryHandler(databaseName, this.host, this.username, this.apiKey);
    }
}


export { SlashDBClient }
