import { DataDiscoveryDatabase } from './datadiscovery.js'
import { SQLPassThruQuery } from './sqlpassthru.js'
import { BaseRequestHandler } from './baserequesthandler.js';
import { isSSOredirect, SSOlogin, SSOloginPopup } from './SSOlogin.js';
import { PKCE } from './pkce.js';
import { generateCodeChallenge, generateRandomString, getUrlParms, popupCenter } from "./utils.js";

const SDB_SDBC_INVALID_HOSTNAME = 'Invalid hostname parameter, must be string';
const SDB_SDBC_INVALID_USERNAME = 'Invalid username parameter, must be string';
const SDB_SDBC_INVALID_APIKEY = 'Invalid apiKey parameter, must be string';
const SDB_SDBC_INVALID_PASSWORD = 'Invalid password parameter, must be string';
const SDB_SDBC_INVALID_IDPID = 'Invalid identity provider parameter, must be string';
const SDB_SDBC_INVALID_REDIRECT_URI = 'Invalid redirect uri parameter, must be string';
const SDB_SDBC_INVALID_USERNAME_MISMATCH = 'Login username must match object username';

/** 
 * Stores parameters necessary to communicate with a SlashDB instance and provides methods for retrieving metadata from the instance.
 */
class SlashDBClient {

  /** 
   * Creates a SlashDB client to connect to a SlashDB instance.
   * @param {Object} config
   * @param {string} config.host - hostname/IP address of the SlashDB instance, including protocol and port number (e.g. http://192.168.1.1:8080)
   * @param {string} config.username - optional username to use when connecting to SlashDB instance using password based login
   * @param {string} config.password - optional password associated with username
   * @param {string} config.apiKey - optional API key associated with username
   * @param {Object} config.sso - optional settings to login with Single Sign-On
   * @param {string} config.sso.idpId - optional identity provider id configured in SlashDB
   * @param {string} config.sso.redirectUri - optional redirect uri to redirect browser after sign in
   * @param {boolean} config.sso.popUp - optional flag to sign in against the identity provider with a Pop Up window (false by default)
   */

  constructor(config) {

    const host = config.host;
    const username = config.username;

    if (!host || typeof(host) !== 'string') {
      throw TypeError(SDB_SDBC_INVALID_HOSTNAME);

    }

    if (username && typeof(username) !== 'string') {
      throw TypeError(SDB_SDBC_INVALID_USERNAME);

    }

    this.host = host;
    this.username = username;

    this.apiKey = null;
    this.password = null;
    this.basic = null;
    this.sso = {
      idpId: null,
      redirectUri: null,
      popUp: false
    }

    if (config.hasOwnProperty('apiKey')) {
      const apiKey = config.apiKey;
      if (apiKey && typeof(apiKey) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_APIKEY);
      }
      this.apiKey = apiKey;
    } else if (config.hasOwnProperty('password')){
      const password = config.password;
      if (password && typeof(password) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_PASSWORD);
      }
      this.password = password;
    } else if (config.hasOwnProperty('sso')) {
      const idpId = config.sso.idpId;
      const redirectUri = config.sso.redirectUri;

      if (idpId && typeof(idpId) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_IDPID);
      }
      if (redirectUri && typeof(redirectUri) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_REDIRECT_URI);
      }

      if (config.sso.hasOwnProperty('popUp')) {
        this.sso.popUp = config.sso.popUp;  
      }

      this.sso.idpId = idpId;
      this.sso.redirectUri = redirectUri;
    }

    this.ssoCredentials = null;

    // create the special case BaseRequestHandler object for interacting with config endpoints
    this.sdbConfig = new BaseRequestHandler(this);

    // SlashDB config endpoints
    this.loginEP = '/login';
    this.logoutEP = '/logout';
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
   * Logs in to SlashDB instance.  Only required when using password-based or SSO login.
   * @returns {true} true - on successful login
   * @throws {Error} on invalid login or error in login process
   */
  async login() {
    let body = {};
    let sso = this.sso;
    
    try {
      if (this.password) {
        body = { login: this.username, password: this.password };
        let response = (await this.sdbConfig.post(body, this.loginEP)).res;
        
        if (response.ok === true) {
          this.basic = btoa(this.username + ":" + this.password);
          this.password = null;
          return true;
        }
        else {
          return false;
        }
      } else if (sso.idpId && sso.redirectUri) {
        if (sso.popUp) {
          await this.loginSSOPopUp(sso.idpId, sso.redirectUri).then((resp) => {
            console.log(resp);
            this.ssoCredentials = resp;
          });
        } else {
          await this.loginSSO(sso.idpId, sso.redirectUri);
        }
        return true;
      }
      
    }
    catch(e) {
      throw Error(e);
    }
  }

  /**
   * Logs in to SlashDB instance.  Only required when using SSO.
   * @ignore
   */
  async loginSSO(idpId, redirectUri) {

    let response = (await this.sdbConfig.get(this.settingsEP)).data

    const jwtSettings = response.auth_settings.authentication_policies.jwt
    const idpSettings = jwtSettings.identity_providers[idpId]

    const clientId = idpSettings.client_id;
    const authorizationEndpoint = idpSettings.authorization_endpoint;
    const tokenEndpoint = idpSettings.token_endpoint;
    const requestedScopes = idpSettings.scope;

    if (!redirectUri || typeof(redirectUri) !== 'string') {
      redirectUri = idpSettings.redirect_uri;
    }

    const ssoConfig = {
      idp_id: idpId,
      client_id: clientId,
      redirect_uri: redirectUri,
      authorization_endpoint: authorizationEndpoint,
      token_endpoint: tokenEndpoint,
      requested_scopes: requestedScopes,
    }

    const urlParams = getUrlParms();

    if (isSSOredirect(urlParams)){
      const url = window.location.href;
      const pkce = new PKCE(ssoConfig);
      pkce.codeVerifier = sessionStorage.getItem('ssoApp.code_verifier');

      pkce.exchangeForAccessToken(url).then((resp) => {
        console.log(resp);
        this.ssoCredentials = resp;
      });
    } else {
      SSOlogin(ssoConfig);
    }
  
  }

  /**
   * Logs in to SlashDB instance.  Only required when using SSO with a Pop Up window.
   * @ignore
   */
  async loginSSOPopUp(idpId, redirectUri) {

    let response = (await this.sdbConfig.get(this.settingsEP)).data

    const jwtSettings = response.auth_settings.authentication_policies.jwt
    const idpSettings = jwtSettings.identity_providers[idpId]

    const clientId = idpSettings.client_id;
    const authorizationEndpoint = idpSettings.authorization_endpoint;
    const tokenEndpoint = idpSettings.token_endpoint;
    const requestedScopes = idpSettings.scope;

    if (!redirectUri || typeof(redirectUri) !== 'string') {
      redirectUri = idpSettings.redirect_uri;
    }

    const ssoConfig = {
      idp_id: idpId,
      client_id: clientId,
      redirect_uri: redirectUri,
      authorization_endpoint: authorizationEndpoint,
      token_endpoint: tokenEndpoint,
      requested_scopes: requestedScopes,
    }

    let state = generateRandomString(128);
    let nonce = generateRandomString(128);
    let codeChallengeMethod = 'S256';
    let codeVerifier = generateRandomString(128);
    let codeChallenge = generateCodeChallenge(codeVerifier);

    const pkce = new PKCE(ssoConfig);

    const additionalParams = {
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
        nonce: nonce,
        response_mode: 'fragment',
        response_type: 'code',
        state: state
    };

    sessionStorage.setItem('ssoApp.idp_id', idpId);
    sessionStorage.setItem('ssoApp.state', state);
    sessionStorage.setItem('ssoApp.nonce', nonce);
    sessionStorage.setItem('ssoApp.code_challenge_method', codeChallengeMethod);
    sessionStorage.setItem('ssoApp.code_verifier', codeVerifier);
    sessionStorage.setItem('ssoApp.code_challenge', codeChallenge);

    const width = 500;
    const height = 600;
    
    const popupWindow = popupCenter(pkce.authorizeUrl(additionalParams), "login", width, height);
    let self = this;

    return new Promise((resolve, reject) => {
      const checkPopup = setInterval(() => {
          const pkce = new PKCE(ssoConfig);
          const popUpHref = popupWindow.window.location.href;
          console.log(popUpHref);
          if (popUpHref.startsWith(window.location.origin)) {
              popupWindow.close();
              
              pkce.codeVerifier = sessionStorage.getItem('ssoApp.code_verifier');
              // pkce.exchangeForAccessToken(popUpHref).then((resp) => {
              //    console.log(resp);
              //    self.idpId = idpId;
              //    self.ssoCredentials = resp;
              // });
          }
          if (!popupWindow || !popupWindow.closed) return;
          clearInterval(checkPopup);
          pkce.exchangeForAccessToken(popUpHref).then((resp) => {
            resolve(resp)
          });
          
      }, 250);
    });
  
  }

  /**
   * Checks whether SlashDB client is authenticated against instance.  
   * @returns {boolean} boolean - to indicate if currently authenticated
   */  
  async isAuthenticated() {
    const url = `${this.userEP}/${this.username}.json`;
    
    try {
      let response = (await this.sdbConfig.get(url)).res
      if (response.ok === true) {
        return true;
      }
      else {
        return false;
      }
    }
    catch(e) {
      return false;
    }
  }

  /**
   * Logs out of SlashDB instance
   */
  async logout() {
    try {
      await this.sdbConfig.get(this.logoutEP);
      if (this.ssoCredentials){
        this.ssoCredentials = null;
      }
    }
    catch(e) {
      console.error(e);
    }
  }

  /**
   * Retrieves host's SlashDB configuration info
   * @returns {object} containing SlashDB configuration items
   */
  async getSettings() {
    return (await this.sdbConfig.get(this.settingsEP)).data
  }

  /**
   * Retrieves SlashDB version number
   * @returns {string} containing SlashDB version number
   */
  async getVersion() {
    return (await this.sdbConfig.get(this.versionEP)).data;
  }

  /**
   * Enables connection to a database configured on SlashDB host
   * @param {string} [dbName] - SlashDB ID of database to connect
   * @returns {object} containing database configuration info and connection status
   */
  async loadModel(dbName) {
    return (await this.sdbConfig.get(`${this.loadEP}/${dbName}`)).data;
  }

  /**
   * Disables connection to a database configured on SlashDB host
   * @param {string} [dbName] - SlashDB ID of database to disconnect
   * @returns {object} containing database configuration info and connection status
   */
  async unloadModel(dbName) {
    return (await this.sdbConfig.get(`${this.unloadEP}/${dbName}`)).data;
  }

    /**
   * Returns current status of SlashDB connection to database
   * @param {string | undefined} [dbName] - SlashDB ID of database to filter on; leave empty to retrieve all databases
   * @returns {object} containing database connection status for all or selected databases
   */
  async getReflectStatus(dbName = undefined) {
    const ep = (!dbName) ? this.reflectStatusEP : `${this.reflectStatusEP.split('.json')[0]}/${dbName}.json`;
    return (await this.sdbConfig.get(ep)).data;
  }

  /**
   * Returns configuration info about SlashDB users
   * @param {string | undefined} [username] - SlashDB ID of user to filter on; leave empty to retrieve all users
   * @returns {object} containing configuration info for all or selected users
   */
  async getUser(username = undefined) {
    const ep = (!username) ? this.userEP : `${this.userEP}/${username}`;
    return (await this.sdbConfig.get(ep)).data;
  }

  /**
   * Returns configuration info about SlashDB databases
   * @param {string | undefined} [dbName] - database ID of database to filter on; leave empty to retrieve all databases
   * @param {boolean} [guiData] - returns additional info normally available in the GUI view when set to true
   * @returns {object} containing configuration info for all or selected databases
   */
  async getDbDef(dbName = undefined, guiData = false) {
    const guiParam = guiData ? '?guidata' : '';
    const ep = (!dbName) ? `${this.dbDefEP}${guiParam}` : `${this.dbDefEP}/${dbName}${guiParam}`;
    return (await this.sdbConfig.get(ep)).data;
  }  

  /**
   * Returns configuration info about SlashDB queries
   * @param {string | undefined} [dbName] - SlashDB ID of query to filter on; leave empty to retrieve all databases
   * @param {boolean} [guiData] - returns additional info normally available in the GUI view when set to true
   * @returns {object} containing configuration info for all or selected queries
   */
  async getQueryDef(queryName = undefined, guiData = false) {
    const guiParam = guiData ? '?guidata' : '';
    const ep = (!queryName) ? `${this.queryDefEP}${guiParam}` : `${this.queryDefEP}/${queryName}${guiParam}`;
    return (await this.sdbConfig.get(ep)).data;
  }	    

  /**
   * Retrieve a list of databases that are configured on the SlashDB instance
   * @returns {Object} databases - a key/value pair object keyed by database ID, with
   * a corresponding `DataDiscoveryDatabase` object for each key
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
   * @param {string} [dbName] - SlashDB database ID; if specified, will only return queries associated with the given database
   * @returns {object} queries - a key/value pair object keyed by query ID, with
   * a corresponding `SQLPassThruQuery` object for each key
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
