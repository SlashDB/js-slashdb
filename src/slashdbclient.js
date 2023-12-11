import { DataDiscoveryDatabase } from './datadiscovery.js'
import { SQLPassThruQuery } from './sqlpassthru.js'
import { BaseRequestHandler } from './baserequesthandler.js';
import { PKCE, generateCodeVerifier, generateCodeChallenge } from './pkce.js';
import { getUrlParms, isSSOredirect, popupCenter } from "./utils.js";

const SDB_SDBC_INVALID_HOSTNAME = 'Invalid hostname parameter, must be string';
const SDB_SDBC_INVALID_USERNAME = 'Invalid username parameter, must be string';
const SDB_SDBC_INVALID_APIKEY = 'Invalid apiKey parameter, must be string';
const SDB_SDBC_INVALID_PASSWORD = 'Invalid password parameter, must be string';
const SDB_SDBC_INVALID_IDPID = 'Invalid identity provider parameter, must be string';
const SDB_SDBC_INVALID_POPUP = 'Invalid popUp parameter, must be boolean';
const SDB_SDBC_INVALID_REDIRECT_URI = 'Invalid redirect uri parameter, must be string';
const SDB_SDBC_IDENTITY_PROVIDER_NOT_AVAILABLE = "Identity provider not available in settings";

/** 
 * Stores parameters necessary to communicate with a SlashDB instance and provides methods for retrieving metadata from the instance.
 */
class SlashDBClient {

  /** 
   * Creates a SlashDB client to connect to a SlashDB instance.
   * 
   * @param {Object} config
   * @param {string} config.host - hostname/IP address of the SlashDB instance, including protocol and port number (e.g. http://192.168.1.1:8080)
   * @param {string} config.apiKey - optional API key associated with username
   * @param {Object} config.sso - optional settings to login with Single Sign-On
   * @param {string} config.sso.idpId - optional identity provider id configured in SlashDB
   * @param {string} config.sso.redirectUri - optional redirect uri to redirect browser after sign in
   * @param {boolean} config.sso.popUp - optional flag to sign in against the identity provider with a Pop Up window (false by default)
   */

  constructor(config) {

    const host = config.host;

    if (!host || typeof(host) !== 'string') {
      throw TypeError(SDB_SDBC_INVALID_HOSTNAME);
    }

    this.host = host;

    this.username = null;
    this.apiKey = null;
    this.basic = null;
    this.sso = {
      idpId: null,
      redirectUri: null,
      popUp: false
    }

    if (config.hasOwnProperty('apiKey')) {
      const apiKey = config.apiKey;
      if (!apiKey || typeof(apiKey) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_APIKEY);
      }
      this.apiKey = apiKey;
    } else if (config.hasOwnProperty('sso')) {
      const idpId = config.sso.idpId;
      const redirectUri = config.sso.redirectUri;
      const popUp = config.sso.popUp;

      if (!idpId || typeof(idpId) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_IDPID);
      }
      if (!redirectUri || typeof(redirectUri) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_REDIRECT_URI);
      }
      if (typeof(popUp) !== 'boolean') {
        throw TypeError(SDB_SDBC_INVALID_POPUP);
      }

      this.sso.idpId = idpId;
      this.sso.redirectUri = redirectUri;
      this.sso.popUp = popUp;
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
   * Logs in to SlashDB instance.  Only required when using username/password based crendentials. if not provided will try SSO login.
   * 
   * @param {string} username - optional username to use when connecting to SlashDB instance using password based login
   * @param {string} password - optional password associated with username
   * @returns {true} true - on successful login
   * @throws {Error} on invalid login or error in login process
   */
  async login(username, password) {

    let body = {};
    let sso = this.sso;

    if (password) {

      if (typeof(username) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_USERNAME);
      }

      if (typeof(password) !== 'string') {
        throw TypeError(SDB_SDBC_INVALID_PASSWORD);
      }

      body = { login: username, password: password };
      let response = (await this.sdbConfig.post(body, this.loginEP)).res;
      
      if (response.ok === true) {
        this.basic = btoa(username + ":" + password);
        this.username = username;
        return true;
      }
      else {
        return false;
      }
    } else if (sso.idpId && sso.redirectUri) {
      await this.loginSSO(sso.popUp).then((resp) => {
        this.ssoCredentials = resp;
      });
      let settings = (await this.sdbConfig.get(this.settingsEP)).data;
      this.username = settings.user;

      if (this.username === null || this.username === 'public'){
        return false;
      }
      return true;
    }
  }

  /** 
   * Updates a SlashDB client instance SSO settings.
   * 
   * @param {Object} sso - optional settings to login with Single Sign-On
   * @param {string} sso.idpId - optional identity provider id configured in SlashDB
   * @param {string} sso.redirectUri - optional redirect uri to redirect browser after sign in
   * @param {boolean} sso.popUp - optional flag to sign in against the identity provider with a Pop Up window (false by default)
   */

  async updateSSO(sso) {
    this.sso.idpId = sso.idpId ? sso.idpId : this.sso.idpId;
    this.sso.redirectUri = sso.redirectUri ? sso.redirectUri : this.sso.redirectUri;
    this.sso.popUp = sso.popUp ? sso.popUp : this.sso.popUp;
  }

  /** 
   * Builds a SSO session from a redirect url, if popUp is not used, this method must be used in the redirect page handler .
   */
  async buildSSORedirect(){
    
    const urlParams = getUrlParms();
    if (isSSOredirect(urlParams)){
      const ssoConfig = await this._getSsoConfig();
      const url = window.location.href;
      const pkce = new PKCE(ssoConfig);
      this.sso.idpId = sessionStorage.getItem('ssoApp.idp_id');
      pkce.codeVerifier = sessionStorage.getItem('ssoApp.code_verifier');

      return new Promise((resolve, reject) => {
        pkce.exchangeForAccessToken(url).then((resp) => {
          this.ssoCredentials = resp;
          resolve(true);
        });
      });
    }
  }

  /**
   * Logs in to SlashDB instance. Only required when using SSO.
   * @param {boolean} popUp - optional flag to sign in against the identity provider with a Pop Up window (false by default)
   */
  async loginSSO(popUp) {

    popUp = popUp ? popUp : this.sso.popUp;

    const ssoConfig = await this._getSsoConfig();
    const pkce = new PKCE(ssoConfig);
    const additionalParams = await this._buildSession();

    let loginUrl = await pkce.authorizeUrl(additionalParams);

    if (!popUp) {
      window.location.replace(loginUrl);
    }

    const width = 500;
    const height = 600;
    
    const popupWindow = popupCenter(loginUrl, "login", width, height);

    return new Promise((resolve, reject) => {
      const checkPopup = setInterval(() => {
          const pkce = new PKCE(ssoConfig);
          let popUpHref = "";
          try {
            popUpHref = popupWindow.window.location.href;
          } catch (e) {
            console.warn(e);
          }
          if (popUpHref.startsWith(window.location.origin)) {
              popupWindow.close();
              
              pkce.codeVerifier = sessionStorage.getItem('ssoApp.code_verifier');
          }
          if (!popupWindow || !popupWindow.closed) return;
          clearInterval(checkPopup);
          pkce.exchangeForAccessToken(popUpHref).then((resp) => {
            resolve(resp);
          });
          
      }, 250);
    });
  }

  /**
   * Refreshes the SSO access token.
   */
  async refreshSSOToken(){

    const ssoConfig = await this._getSsoConfig();
    const pkce = new PKCE(ssoConfig);
    const refreshToken = this.ssoCredentials.refresh_token;

    return new Promise((resolve, reject) => {
      pkce.refreshAccessToken(refreshToken).then((resp) => {
        this.ssoCredentials = resp;
        resolve(true);
      });
    });
  }

  /**
   * Checks whether SlashDB client is authenticated against instance.  
   * 
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
      this.ssoCredentials = null;
      this._clearSession();
    }
    catch(e) {
      console.error(e);
    }
  }

  /**
   * Retrieves host's SlashDB configuration info
   * 
   * @returns {object} containing SlashDB configuration items
   */
  async getSettings() {
    return (await this.sdbConfig.get(this.settingsEP)).data
  }

  /**
   * Retrieves SlashDB version number
   * 
   * @returns {string} containing SlashDB version number
   */
  async getVersion() {
    return (await this.sdbConfig.get(this.versionEP)).data;
  }

  /**
   * Enables connection to a database configured on SlashDB host
   * 
   * @param {string} [dbName] - SlashDB ID of database to connect
   * @returns {object} containing database configuration info and connection status
   */
  async loadModel(dbName) {
    return (await this.sdbConfig.get(`${this.loadEP}/${dbName}`)).data;
  }

  /**
   * Disables connection to a database configured on SlashDB host
   * 
   * @param {string} [dbName] - SlashDB ID of database to disconnect
   * @returns {object} containing database configuration info and connection status
   */
  async unloadModel(dbName) {
    return (await this.sdbConfig.get(`${this.unloadEP}/${dbName}`)).data;
  }

    /**
   * Returns current status of SlashDB connection to database
   * 
   * @param {string | undefined} [dbName] - SlashDB ID of database to filter on; leave empty to retrieve all databases
   * @returns {object} containing database connection status for all or selected databases
   */
  async getReflectStatus(dbName = undefined) {
    const ep = (!dbName) ? this.reflectStatusEP : `${this.reflectStatusEP.split('.json')[0]}/${dbName}.json`;
    return (await this.sdbConfig.get(ep)).data;
  }

  /**
   * Returns configuration info about SlashDB users
   * 
   * @param {string | undefined} [username] - SlashDB ID of user to filter on; leave empty to retrieve all users
   * @returns {object} containing configuration info for all or selected users
   */
  async getUser(username = undefined) {
    const ep = (!username) ? this.userEP : `${this.userEP}/${username}`;
    return (await this.sdbConfig.get(ep)).data;
  }

  /**
   * Returns configuration info about SlashDB databases
   * 
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
   * 
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
   * 
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
   * 
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

  async _getSsoConfig() {
    let response = (await this.sdbConfig.get(this.settingsEP)).data;
    let idpId = this.sso.idpId;
    let redirectUri = this.sso.redirectUri;

    const jwtSettings = response.auth_settings.authentication_policies.jwt

    if (!jwtSettings.identity_providers.hasOwnProperty(this.sso.idpId)) {
      throw new Error(SDB_SDBC_IDENTITY_PROVIDER_NOT_AVAILABLE);
    }

    const idpSettings = jwtSettings.identity_providers[this.sso.idpId]

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

    return ssoConfig;
  }

  async _buildSession() {
    let state = generateCodeVerifier(128);
    let nonce = generateCodeVerifier(128);
    let codeChallengeMethod = 'S256';
    let codeVerifier = generateCodeVerifier(128);
    let codeChallenge = await generateCodeChallenge(codeVerifier);
    let idpId = this.sso.idpId;

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

    return additionalParams;
  }

  _clearSession(){
    sessionStorage.removeItem('ssoApp.idp_id');
    sessionStorage.removeItem('ssoApp.state');
    sessionStorage.removeItem('ssoApp.nonce');
    sessionStorage.removeItem('ssoApp.code_challenge_method');
    sessionStorage.removeItem('ssoApp.code_verifier');
    sessionStorage.removeItem('ssoApp.code_challenge');
  }
}


export { SlashDBClient }
