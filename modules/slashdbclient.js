import { fetchWrapper } from './fetchwrapper.js';
import { DataDiscoveryResource as SDBConfig, DataDiscoveryDatabase } from './datadiscovery.js'

class SlashDBClient {
    constructor(host, username, apiKey) {
      this.host = host;
      this.username = username
      this.apiKey = apiKey;
      this.headers = { apikey: this.apiKey }
      this.isAuthenticatedFlag = false;

      // create the special case DataDiscovery object for interacting with config endpoints
      this.sdbConfig = new SDBConfig(undefined, undefined, this, true);

      // SlashDB config endpoints
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
      //const temp = dataFormat; // comment out for now...work on this later
      const url = this.host + '/login';
      const body = { login: this.username, password: this.password };

      await fetchWrapper('POST', url, body, this.headers, true).then((res) => {
        if (res) {
          if (res.status === 200 || res.status === 304) {
              this.isAuthenticatedFlag = true;
          } else {
              this.isAuthenticatedFlag = false;
          }
        }
      });
    }

    async isAuthenticated() {
      const url = this.host + `/userdef/${this.username}.json`;
      
      await fetchWrapper('GET', url, undefined, this.headers, true)
        .then((response) => {
          return response.status === 200;
        })
        .then((value) => {
          this.isAuthenticatedFlag = value;
        });
      return this.isAuthenticatedFlag;
    }

      /* *** configuration endpoint getters/setters */

    async getSettings() {
      return (await this.sdbConfig.get(this.settingsEP))[0]
    }

    async getVersion() {
   		return (await this.sdbConfig.get(this.versionEP))[0];
   	}

    async loadModel(dbName) {
 	  	return (await this.sdbConfig.get(`${this.loadEP}/${dbName}`))[0];
   	}

    async unloadModel(dbName) {
      return (await this.sdbConfig.get(`${this.unloadEP}/${dbName}`))[0];
    }

    async getReflectStatus(dbName = undefined) {
 		  const ep = (!dbName) ? this.reflectStatusEP : `${this.reflectStatusEP.split('.json')[0]}/${dbName}.json`;
 		  return (await this.sdbConfig.get(ep))[0];
 	  }

    async getUser(username = undefined) {
   		const ep = (!username) ? this.userEP : `${this.userEP}/${username}`;
    	return (await this.sdbConfig.get(ep))[0];
 	  }

    async getDbDef(dbName = undefined, guiData = false) {
      const guiParam = guiData ? '?guidata' : '';
      const ep = (!dbName) ? `${this.dbDefEP}${guiParam}` : `${this.dbDefEP}/${dbName}${guiParam}`;
      return (await this.sdbConfig.get(ep))[0];
    }  

 	  async getQueryDef(queryName = undefined, guiData = false) {
   		const guiParam = guiData ? '?guidata' : '';
   		const ep = (!queryName) ? `${this.queryDefEP}${guiParam}` : `${this.queryDefEP}/${queryName}${guiParam}`;
   		return (await this.sdbConfig.get(ep))[0];
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
