/**
 * fetch API wrapper for handling HTTP requests.
 *
 * @param {String} httpMethod - HTTP Method to be used in the http request send.
 * @param {String} url - protocol, host:port and path to resource/endpoint
 * @param {Object} body - Payload to be sent. Object of key value pairs.

 * @param {Object} headers - Header params to be included. Object of key value pairs.
 * @param {Boolean} onlyRes - Only response needed or expecting incoming payload.
 * @returns {Boolean} returnObj.data -response payload.
 * @returns {Object} returnObj.res -response.
 */
  async function fetchWrapper(
    httpMethod,
    url,
    body,
    headers,
    onlyRes
  ) {

    let apiKeyValue;    // set this for now..fix later
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
      // for urls that aren't JSON data - eg /version.txt, /license - return the raw data
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

  export { fetchWrapper }