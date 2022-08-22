//import fetch from 'node-fetch';	// requires node-fetch < 2.0 to work properly with Jest

//import DomParser from 'dom-parser';

/**
 * Vanilla Javascript methods for use of Slashdb in javascript based project.
 * Also serves as under the hood methods for React specific functionality.
 */

//Import cookie handling functionality from cookies.js

// class SlashDBService {
	// constructor() {
		
		// // SlashDB application config endpoints
		// this.settingsEP = '/settings.json';
		// this.versionEP = '/version.txt';
		// this.licenseEP = '/license';
		// this.loadEP = '/load-model';
		// this.unloadEP = '/unload-model';
		// this.checkDBConnEP = '/settings/check-database-connection.json';
		// this.reflectStatusEP = '/settings/reflect-status.json';
		
		// // user config endpoint
		// this.userEP = '/userdef';
		
		// // database definitions endpoint
		// this.dbDefEP = '/dbdef';
		
		// // query definitions endpoint
		// this.queryDefEP = '/querydef';

	// }


// export function slashDBService() {

// 	// SlashDB application config endpoints
// 	const settingsEP = '/settings.json';
// 	const versionEP = '/version.txt';
// 	const licenseEP = '/license';
// 	const loadEP = '/load-model';
// 	const unloadEP = '/unload-model';
// 	const checkDBConnEP = '/settings/check-database-connection.json';
// 	const reflectStatusEP = '/settings/reflect-status.json';
	
// 	// user config endpoint
// 	const userEP = '/userdef';
	
// 	// database definitions endpoint
// 	const dbDefEP = '/dbdef';
	
// 	// query definitions endpoint
// 	const queryDefEP = '/querydef';
		
// 	async function getSettings() {
// 		return await get(settingsEP)
// 	}

// 	async function getVersion() {
// 		const versionTxt = await get(versionEP);
// 		return {version : versionTxt}
// 	}

// 	async function getLicense() {
// 		const htmlString = await get(licenseEP);
		
// 		// parse the HTML doc that the license endpoint returns and get the datalist elements
// 		// where license info resides
// 		let htDoc = null;
// 		try {
// 			htDoc = new DOMParser().parseFromString(htmlString, 'text/html');
// 		}
// 		catch {
// 			htDoc = new DomParser().parseFromString(htmlString, 'text/html');
// 		}
		
// 		const licenseDetailsNodes = htDoc.querySelector('dl.dl-horizontal');
// 		const dbLicenseDetailsNodes = htDoc.querySelectorAll('div.licensed-db-type');
		
// 		const licenseDetails = {};
// 		licenseDetails['Database Licenses'] = {};		
// 		let fldLabel = null;
		
// 		// go over each item in the license details nodes, assigning DT elements/DD elements
// 		// as key:value pairs
// 		for (let n of licenseDetailsNodes.children) {

// 			if (n.tagName === 'DT') {
// 				fldLabel = n.innerHTML.slice(0,-1);
// 			}
// 			// append sibling DD values together
// 			else if (licenseDetails[fldLabel] !== undefined) {
// 				licenseDetails[fldLabel] = `${licenseDetails[fldLabel]} ${n.innerHTML}`.trim();
				
// 			}
// 			else {
// 				licenseDetails[fldLabel] = n.innerHTML;
// 			}
// 		}	

// 		// go over each item in the DB license details nodes and
// 		// extract the DB type and license status to create key:value pairs
// 		for (let n of dbLicenseDetailsNodes) {
// 			let dbString = n.querySelector('div').firstElementChild.innerHTML;
// 			const [dbName, licenseStatus] = dbString.split(' : ');
// 			licenseDetails['Database Licenses'][dbName] = licenseStatus;
// 		}
			
// 		return licenseDetails;
// 	}
	
// 	async function loadModel(dbName) {
// 		return await get(`${loadEP}/${dbName}`);
// 	}

// 	async function unloadModel(dbName) {
// 		return await get(`${unloadEP}/${dbName}`);
// 	}
	
// 	function testDBConnection() {
// 		return false;
// 	}
	
// 	async function getReflectStatus(dbName = undefined) {
// 		const ep = (dbName === undefined || dbName === null) ? reflectStatusEP : `${reflectStatusEP.split('.json')[0]}/${dbName}.json`;
// 		return await get(ep);
// 	}

// 	async function getUser(username = undefined) {
// 		const ep = (username === undefined || username === null) ? userEP : `${userEP}/${username}`;
// 		return await get(ep);
// 	}

// 	async function addUser(data) {
// 		return await post(userEP, data);
// 	}
	
// 	async function updateUser(username, data) {
// 		const ep = `${userEP}/${username}.json`;		
// 		return await put(ep, data)
// 	}
	
// 	async function deleteUser(username) {
// 		const ep = `${userEP}/${username}.json`;		
// 		return await _delete(ep)
// 	}

// 	async function getDbDef(dbName = undefined, guiData = false) {
// 		const guiParam = guiData ? '?guidata' : '';
// 		const ep = (dbName === undefined || dbName === null) ? `${dbDefEP}${guiParam}` : `${dbDefEP}/${dbName}${guiParam}`;
// 		return await get(ep);
// 	}

// 	async function getQueryDef(queryName = undefined, guiData = false) {
// 		const guiParam = guiData ? '?guidata' : '';
// 		const ep = (queryName === undefined || queryName === null) ? `${queryDefEP}${guiParam}` : `${queryDefEP}/${queryName}${guiParam}`;
// 		return await get(ep);
// 	}	
	
// 	return [getSettings, getVersion, getLicense, 
// 			loadModel, unloadModel, testDBConnection,
// 			getReflectStatus, getUser, addUser, updateUser, 
// 			deleteUser, getDbDef, getQueryDef
// 			];
// }


/**
 * Set cookie with params based on passed values to function. Main use in SDK for storing username for auth needs.
 *
 * @param {String} cname Name of cookie.
 * @param {String} cvalue Value of cookie.
 */
const setCookie = (cname, cvalue) => {
  var cookieExpires = new Date();
  cookieExpires.setTime(cookieExpires.getTime() + 1 * 12 * 60 * 60 * 1000);
  document.cookie = `${cname}=${cvalue}; expires=${cookieExpires}; Path=/;`;
};

/**
 * Look at cookie with name matching, cname param and get its value.
 *
 * @param {String} cname Name of cookie
 * @return {String}  Value of cookie with name matching inncoming param cname.
 */
function getCookie(cname) {
  var name = cname + '=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}

/**
 * Delete cookie with name matching cname param.
 *
 * @param {String} cname Name of cookie.
 */
function delete_cookie(cname) {
  document.cookie = cname + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}




//Export all exposed methods.
/**
 * Base entity for vanilla JS operations: 
  setUp,
  get,
  post,
  put,
  delete: _delete,
  executeQuery,
  dataDiscovery,
  authenticateCookieSessionLogin,
  authenticateCookieSessionLogout,
  isAuthenticated,
  getIsAuthenticated,
  setIsAuthenticated,
 */
const slashDB = {
  setUp,
  get,
  post,
  put,
  delete: _delete,
  executeQuery,
  dataDiscovery,
  authenticateCookieSessionLogin,
  authenticateCookieSessionLogout,
  isAuthenticated,
  getIsAuthenticated,
  setIsAuthenticated,
};

//Declare local variables. Will serve to hold vital set up info provided by user.
let baseUrl = '';
let dataFormat = ``;
let apiKeyValue = ``;

//Set initial value for isAuthenticatedVar. Used to check if user session is valid.
let isAuthenticatedVar = false;



/**
 * Set internal variables values for server connection. Once set, incoming options will be used for future interaction
 * with SlashDB. Options include server url, dataformat of response and API key to be used for validation.
 *
 * @param {String} baseUrlPath - Root path of slashdb server. Example http://localhost:8000.
 * @param {Object} setUpOptions - Setup options for use and connection to SlashDB server. Key value format.
 * @param {String} setUpOptions.dataFormatExt - Format of data. Json, XML, CSV, HTML, XSD.
 * @param {String} setUpOptions.apikey - API key for authentication purposes.
 */
//export function setUp(baseUrlPath, setUpOptions) {
  function setUp(baseUrlPath, setUpOptions) {
  baseUrl = baseUrlPath;
  if (setUpOptions) {
    setUpOptions.dataFormatExt &&
      (dataFormat = `.${setUpOptions.dataFormatExt}`);
    setUpOptions.apiKey && (apiKeyValue = `${setUpOptions.apiKey}`);
  }
}

/**
 * Login via username and password - Cookie Session authentication. Perform POST request to slashdb/login and based on response
 * validate or reject session. Set or delete cookie.
 * Send POST request with login: username, password: password as payload.
 *
 * @param {String} username - Username of user.
 * @param {String} password - Password of user.
 */
async function authenticateCookieSessionLogin(username, password) {
  const temp = dataFormat;
  dataFormat = '';
  const urlPath = '/login';
  const body = { login: username, password: password };
  await raw('POST', urlPath, body, undefined, undefined, true).then((res) => {
    if (res) {
      if (res.status === 200 || 304) {
        isAuthenticatedVar = true;
        setCookie('user_id', username);
      } else {
        isAuthenticatedVar = false;
        delete_cookie('user_id');
      }
    }
  });
  dataFormat = temp;
}

/**
 * Send request to logout user. Delete cookie.
 *
 */
async function authenticateCookieSessionLogout() {
  const temp = dataFormat;
  dataFormat = '';
  const urlPath = '/logout';
  await raw('GET', urlPath, undefined, undefined, undefined, true).then(() => {
    isAuthenticatedVar = false;
    delete_cookie('user_id');
  });

  dataFormat = temp;
}

/**
 * Check if session is valid. Check if user is still logged in.
 * Set internal variable isAuthenticatedVar to true or false based on response.
 *
 * @return {boolean} getIsAuthenticated()
 */
async function isAuthenticated() {
  const localUser = getCookie('user_id');
  const url = `/userdef/taskapp`;

  await raw('GET', url, undefined, undefined, undefined, true)
    .then((response) => {
      return response.status === 200;
    })
    .then((value) => {
      setIsAuthenticated(value);
    });
  return getIsAuthenticated();
}

/**
 * Returns value of isAuthenticatedVar.
 *
 * @return {boolean} isAuthenticatedVar. True or False.
 */
function getIsAuthenticated() {
  return isAuthenticatedVar;
}

/**
 * Set value of isAuthenticatedVar.
 *
 * @param {boolean} x Value isAuthenticatedVar assumes.
 */
function setIsAuthenticated(x) {
  isAuthenticatedVar = x;
}

/**
 * Internal method for handling HTTP requests.
 *
 * @param {String} httpMethod - HTTP Method to be used in in the http request send.
 * @param {String} urlPath - Url path to be added to base url path provided in SetUp where request will be made.
 * @param {Object} body - Payload to be sent. Object of key value pairs.
 * @param {Object} queryStrParams - Params to be sent via url.
 * @param {Object} headers - Header params to be included. Object of key value pairs.
 * @param {Boolean} onlyRes - Only response needed or expecting incoming payload.
 * @returns {Boolea} returnObj.data -response payload.
 * @returns {Object} returnObj.res -response.
 */
async function raw(
  httpMethod,
  urlPath,
  body,
  queryStrParams,
  headers,
  onlyRes
) {
  const queryStrParameters =
    queryStrParams !== undefined
      ? queryStrParamsConstructor(queryStrParams)
      : '';
  const url = baseUrl + urlPath + queryStrParameters;
  const requestOptions = {
    method: `${httpMethod}`,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      apikey: apiKeyValue !== undefined ? apiKeyValue : null,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : null,
  };

  const returnObj = { data: null, res: null };
  try {
    await fetch(url, requestOptions)
      .then((response) => {
        returnObj.res = response;
        returnObj.data = onlyRes ? null : handleResponse(response);
      })
      .catch((error) => {
        console.log(error.response);
      });
  } catch (error) {
    console.log(error);
  }
  if (onlyRes) {
    return returnObj.res;
  } else {
    return [returnObj.data, returnObj.res];
  }
}

/** Internal method for handling HTTP GET requests
 *
 * @param {String} urlPath - Url path to be added to base url path provided in SetUp where request will be made.
 * @param {String} queryStrParameters - Params to be sent via url.
 * @param {Object} headers - Header params to be included. Object of key value pairs.
 * @returns {Object} Data - response payload.
 */
async function get(urlPath, queryStrParameters, headers) {
  const [data, res] = await raw(
    'GET',
    urlPath,
    undefined,
    queryStrParameters,
    headers
  );
  return data;
}

/** Internal method for handling HTTP POST requests
 *
 * @param {String} urlPath - Url path to be added to base url path provided in SetUp where request will be made.
 * @param {Object} body - Payload to be sent. Object of key value pairs.
 * @param {String} queryStrParameters - Params to be sent via url.
 * @param {Object} headers - Header params to be included. Object of key value pairs.
 * @returns {Object} Data - response payload.
 */
async function post(urlPath, body, queryStrParameters, headers) {
  const [data, res] = await raw(
    'POST',
    urlPath,
    body,
    queryStrParameters,
    headers
  );
  return data;
}
/** Internal method for handling HTTP PUT requests
 *
 * @param {String} urlPath - Url path to be added to base url path provided in SetUp where request will be made.
 * @param {Object} body - Payload to be sent. Object of key value pairs.
 * @param {String} queryStrParameters - Params to be sent via url.
 * @param {Object} headers - Header params to be included. Object of key value pairs.
 * @returns {Object}
 * @param  data - Response payload.
 */
async function put(urlPath, body, queryStrParameters, headers) {
  const [data, res] = await raw(
    'PUT',
    urlPath,
    body,
    queryStrParameters,
    headers
  );
  return data;
}
/** Internal method for handling HTTP DELETE requests
 *
 * @param {String} urlPath - Url path to be added to base url path provided in SetUp where request will be made.
 * @param {String} queryStrParameters - Params to be sent via url.
 * @param {Object} headers - Header params to be included. Object of key value pairs.
 * @returns {Object} Data - response payload.
 */
async function _delete(urlPath, queryStrParameters, headers) {
  const [data, res] = await raw(
    'DELETE',
    urlPath,
    undefined,
    queryStrParameters,
    headers
  );
  return data;
}

/** Method utilizing SQLpassthrough functionality of SlashDB API - for executing a query.
 *
 * @param {String} httpMethod - HTTP Method to be used in the http request send.
 * @param {String} queryID - Name of query as is in SlashDB interface.
 * @param {Object} parameters - Params to be send via url.
 * @param {Object} queryStrParameters - Specific params to be passed in url string for query in object as key value pair format.
 * @param {Object} headers - Header params to be included. Object of key value pairs.
 * @returns {Promise} Promise object represents response from server after performing a request of type set by httpMethod param
 * - Prototype, PromiseState, PromiseResult
 */
async function executeQuery(
  httpMethod,
  queryID,
  parameters,
  queryStrParameters,
  headers
) {
  const queryUrlParametersStr = `/query/${queryID}${queryParamsConstructor(
    parameters
  )}`;
  switch (httpMethod) {
    case 'get':
      return await get(queryUrlParametersStr, queryStrParameters, headers);
    case 'post':
      return await post(
        queryUrlParametersStr,
        undefined,
        queryStrParameters,
        headers
      );
    case 'put':
      return await put(
        queryUrlParametersStr,
        undefined,
        queryStrParameters,
        headers
      );
    case 'delete':
      return await _delete(queryUrlParametersStr, queryStrParameters, headers);

    default:
      return await get(queryUrlParametersStr, queryStrParameters, headers);
  }
}
/**
 * Method to utilize data discovery feature of SlashDB API. Basicly GET, POST, PUT or DELETE interaction with remote database.
 *
 * @param {String} httpMethod - HTTP Method to be used in the http request send.
 * @param {String} database - Name of database to be accessed.
 * @param {Object} parameters - Params to be send via url.
 * @param {*} queryStrParameters
 * @param {Object} body - Payload to be sent. Object of key value pairs.
 * @param {Object} headers - Header params to be included. Object of key value pairs.
 * @returns {Promise} Promise object represents response from server after performing a request of type set by httpMethod param
 * - Prototype, PromiseState, PromiseResult
 */
async function dataDiscovery(
  httpMethod,
  database,
  parameters,
  queryStrParameters,
  body = undefined,
  headers
) {
  const dataDiscoveryUrlParametersStr = `/db/${database}${dataDiscoveryParamsConstructor(
    parameters
  )}`;
  switch (httpMethod) {
    case 'get':
      return await get(
        dataDiscoveryUrlParametersStr,
        queryStrParameters,
        headers
      );
    case 'post':
      return await post(
        dataDiscoveryUrlParametersStr,
        body,
        queryStrParameters,
        headers
      );
    case 'put':
      return await put(
        dataDiscoveryUrlParametersStr,
        body,
        queryStrParameters,
        headers
      );
    case 'delete':
      return await _delete(
        dataDiscoveryUrlParametersStr,
        queryStrParameters,
        headers
      );

    default:
      return await get(
        dataDiscoveryUrlParametersStr,
        queryStrParameters,
        headers
      );
  }
}

/** Helper function to handle requests response.
 *
 * @param {*} response
 * @returns {Object} data
 */
async function handleResponse(response) {
  return await response.text().then((text) => {
	let data;
	try {
		data = text && JSON.parse(text);
	}
	// for endpoints that aren't JSON data - eg /version.txt, /license - return the raw data
	catch(e) {
		if (e instanceof SyntaxError) {
			data = text;
		}
		else {
			console.error("Error encountered in handleResponse");
			return Promise.reject("Error encountered in handleResponse")
		}
	}

    if (!response.ok) {
      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }

    return data;
  });
}

/**
 * Help construct url path from array for data discovery.
 *
 * @param {array} queryParamsArr Array of path params.
 * @return {String} String format of params for url passing eg. /arra[0]/array[1].../array[n]
 */
function dataDiscoveryParamsConstructor(queryParamsArr) {
  let pathStr = '';
  if (queryParamsArr) {
    queryParamsArr.map((param) => {
      return (pathStr += `/${param}`);
    });
  }
  return pathStr;
}

/**
 * Help construct string url path from object for query params. Any params that are required by query to execute.
 * Such as if query requires TaskListId to execute - receive TaskListId: 1 - return /TaskListId/1
 *
 * @param {obj} queryParamsObj Object of key and value pairs.
 * @return {String} String format of params for url passing eg. /key(0)/value[key(0)].../key(n)/value[key(n)].
 */
function queryParamsConstructor(queryParamsObj) {
  let pathStr = '';
  Object.keys(queryParamsObj).forEach(function eachKey(key) {
    pathStr += `/${key}/${queryParamsObj[key]}`;
  });
  return pathStr;
}
/**
 * Help construct string url path from object for query options params.  Such as limit # of rows, offset # of rows eg. ?limit=23
 *
 * @param {obj} queryParamsObj Object of key and value pairs.
 * @return {String} String format of params for url passing eg. ?key(0)=value[key(0)]&...key(n)=value[key(n)]&.
 */
function queryStrParamsConstructor(queryStrParamsObj) {
  let queryStrParams = '?';
  Object.keys(queryStrParamsObj).forEach(function eachKey(key) {
    queryStrParams += `${key}=${queryStrParamsObj[key]}&`;
  });
  return queryStrParams;
}

