// for pre v17/18 Node environment, node-fetch module required
// //let fetch = null;
// if (typeof(window) !== 'undefined') {
//   fetch = window.fetch;
// }
// else {
//   (async () => {
//       let f = await import("node-fetch");
//       fetch = f.default
//     }
//   )();
// }


/**
 * fetch API wrapper for handling HTTP requests.
 *
 * @param {String} httpMethod - HTTP method to use for the fetch() call
 * @param {String} url - protocol, host:port and path to resource/endpoint
 * @param {Object} body - Payload to be sent; object containing key/value pairs.
 * @param {Object} headers - Header parameters to send in request; object containing key/value pairs.
 * @param {Boolean} [onlyRes] - Flag to indicate whether to send back HTTP response status only or also send back data
 * @returns {Object} returnObj.data - response data.
 * @returns {Object} returnObj.res - response status.
 * @throws {Error} error message with HTTP status code if applicable on 4xx/5xx/network errors
 */
  async function fetchWrapper(
    httpMethod,
    url,
    body,
    headers,
    onlyRes = false
  ) {

    if (body !== undefined) {
      if (headers['Content-Type'] === 'application/json') {
          body = JSON.stringify(body);
      }
    }
    else {
      body = null;
    }
    const requestOptions = {
      method: `${httpMethod}`,
      credentials: 'include',
      headers: {
        ...headers,
      },
      body: body
    };
  
    const returnObj = { data: null, res: null };

    try {
      let response = await fetch(url, requestOptions);

      if (response.ok === true) {
        returnObj.res = response;
        if (!onlyRes) {
          await handleResponse(response, returnObj);
        }
      }
      else {
        const statusCode = response.status;
        const headers = response.headers;
        let errMsg = statusCode
        if (headers.has('Warning')) {
          errMsg = `HTTP ${statusCode}: ${headers.get('Warning')}`;
        }
        console.error(errMsg);
        throw Error(statusCode);
      }
    } 
    catch (e) {
      throw Error(e.message);
    }
    if (onlyRes) {
      return returnObj.res;
    } else {
      return returnObj;
    }
  }


  /** Helper function to handle requests response.
 *
 * @param {*} response
 * @returns {Object} data
 */
async function handleResponse(response, returnObj) {
  let data, text;
  try {
    data = await response.text();
    text = data;
    data = data && JSON.parse(data);
  }
  // for urls that aren't JSON data return the raw data
  catch(e) {
      if (e instanceof SyntaxError) {
          data = text;
      }
      else {
          console.error("Error encountered in handleResponse");
          return Promise.reject("Error encountered in handleResponse");
      }
  }

  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }
  returnObj.data = data;
}

export { fetchWrapper }