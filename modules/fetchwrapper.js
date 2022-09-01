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
      //console.log(await response.text())
      if (response.ok === true) {
        returnObj.res = response;
        returnObj.data = onlyRes ? null : handleResponse(response);
      }
      else {
        let errMsg = response.status;
        let headers = response.headers;
        if (headers.has('Warning')) {
          errMsg = `HTTP ${errMsg}: ${headers.get('Warning')}`;
        }
        throw Error(errMsg)
      }
    } catch (e) {
      console.error(e);
      throw Error(e);      
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
  let data, text;
  try {
    data = await response.text()
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
          return Promise.reject("Error encountered in handleResponse")
      }
  }

  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
    return Promise.reject(error);
  }

  return data;
}


  // fetchWrapper old
  //   try {
  //     let resposne await fetch(url, requestOptions)
  //       .then((response) => {
  //         returnObj.res = response;
  //         returnObj.data = onlyRes ? null : handleResponse(response);
  //       })
  //       .catch((error) => {
  //         throw Error(error.response);
  //         console.log(error.response);
  //       });
  //   } catch (error) {
  //     throw Error(error.response);      
  //     console.log(error);
  //   }
  //   if (onlyRes) {
  //     return returnObj.res;
  //   } else {
  //     return [returnObj.data, returnObj.res];
  //   }
  // }


// async function handleResponse(response) {
//     return await response.text().then((text) => {
//       let data;
//       try {
//           data = text && JSON.parse(text);
//       }
//       // for urls that aren't JSON data return the raw data
//       catch(e) {
//           if (e instanceof SyntaxError) {
//               data = text;
//           }
//           else {
//               console.error("Error encountered in handleResponse");
//               return Promise.reject("Error encountered in handleResponse")
//           }
//       }
  
//       if (!response.ok) {
//         const error = (data && data.message) || response.statusText;
//         return Promise.reject(error);
//       }
  
//       return data;
//     });
//   }

  export { fetchWrapper }