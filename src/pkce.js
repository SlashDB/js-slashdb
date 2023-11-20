/**
 * @ignore
 */
class PKCE {
  state = ""
  codeVerifier = ""
  corsRequestOptions = {}

  /**
   * Initialize the instance with configuration
   * @param {IConfig} config
   */
  constructor(config) {
    this.config = config
  }

  /**
   * Allow the user to enable cross domain cors requests
   * @param  enable turn the cross domain request options on.
   * @return ICorsOptions
   */
  enableCorsCredentials(enable) {
    this.corsRequestOptions = enable
      ? {
          credentials: "include",
          mode: "cors"
        }
      : {}
    return this.corsRequestOptions
  }

  /**
   * Generate the authorize url
   * @param  {object} additionalParams include additional parameters in the query
   * @return Promise<string>
   */
  async authorizeUrl(additionalParams = {}) {
    const codeChallenge = await this.pkceChallengeFromVerifier()
    const queryString = new URLSearchParams(
      Object.assign(
        {
          response_type: "code",
          client_id: this.config.client_id,
          state: this.getState(additionalParams.state || null),
          scope: this.config.requested_scopes,
          redirect_uri: this.config.redirect_uri,
          code_challenge: codeChallenge,
          code_challenge_method: "S256"
        },
        additionalParams
      )
    ).toString()

    return `${this.config.authorization_endpoint}?${queryString}`
  }

  /**
   * Given the return url, get a token from the oauth server
   * @param  url current urlwith params from server
   * @param  {object} additionalParams include additional parameters in the request body
   * @return {Promise<ITokenResponse>}
   */
  exchangeForAccessToken(url, additionalParams = {}) {
    return this.parseAuthResponseUrl(url).then(q => {
      return fetch(this.config.token_endpoint, {
        method: "POST",
        body: new URLSearchParams(
          Object.assign(
            {
              grant_type: "authorization_code",
              code: q.code,
              client_id: this.config.client_id,
              redirect_uri: this.config.redirect_uri,
              code_verifier: this.getCodeVerifier()
            },
            additionalParams
          )
        ),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        ...this.corsRequestOptions
      }).then(response => response.json())
    })
  }

  /**
   * Given a refresh token, return a new token from the oauth server
   * @param  refreshTokens current refresh token from server
   * @return {Promise<ITokenResponse>}
   */
  refreshAccessToken(refreshToken) {
    return fetch(this.config.token_endpoint, {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.config.client_id,
        refresh_token: refreshToken
      }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      }
    }).then(response => response.json())
  }

  /**
   * Get the current codeVerifier or generate a new one
   * @return {string}
   */
  getCodeVerifier() {
    if (this.codeVerifier === "") {
      this.codeVerifier = this.randomStringFromStorage("pkce_code_verifier")
    }

    return this.codeVerifier
  }

  /**
   * Get the current state or generate a new one
   * @return {string}
   */
  getState(explicit = null) {
    const stateKey = "pkce_state"

    if (explicit !== null) {
      this.getStore().setItem(stateKey, explicit)
    }

    if (this.state === "") {
      this.state = this.randomStringFromStorage(stateKey)
    }

    return this.state
  }

  /**
   * Get the query params as json from a auth response url
   * @param  {string} url a url expected to have AuthResponse params
   * @return {Promise<IAuthResponse>}
   */
  parseAuthResponseUrl(url) {
    // const params = new URL(url).searchParams
    const [hash, query] = url.split('#')[1].split('?');
    const params = new URLSearchParams(hash);

    return this.validateAuthResponse({
      error: params.get("error"),
      query: params.get("query"),
      state: params.get("state"),
      code: params.get("code")
    })
  }

  /**
   * Shortcut function to the hasher's object interface.
   *
   * @param {plain|string} message The message to hash.
   *
   * @return {ArrayBuffer} The hash.
   */
  sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256", data);
  }

  /**
   * Base64 encoding strategy.
   * @return {string}
   */
  base64urlencode(a) {
    var str = "";
    var bytes = new Uint8Array(a);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  /**
   * Generate a code challenge
   * @return {Promise<string>}
   */
  async pkceChallengeFromVerifier() {
    let v = this.getCodeVerifier();
    var hashed = await this.sha256(v);
    var base64encoded = base64urlencode(hashed);
    return base64encoded;
  }

  /**
   * Get a random string from storage or store a new one and return it's value
   * @param  {string} key
   * @return {string}
   */
  randomStringFromStorage(key) {
    const fromStorage = this.getStore().getItem(key)
    if (fromStorage === null) {
      this.getStore().setItem(key, this.generateCodeVerifier())
    }

    return this.getStore().getItem(key) || ""
  }

  dec2hex(dec) {
    return ("0" + dec.toString(16)).substr(-2);
  }

  /**
   * Get a random string
   * @param  {string} size (Optional)
   * @return {string}
   */
  generateCodeVerifier(size = 128) {
    var array = new Uint32Array(size / 2);
    window.crypto.getRandomValues(array);
  
    return Array.from(array, this.dec2hex).join("");
  }

  /**
   * Validates params from auth response
   * @param  {AuthResponse} queryParams
   * @return {Promise<IAuthResponse>}
   */
  validateAuthResponse(queryParams) {
    return new Promise((resolve, reject) => {
      if (queryParams.error) {
        return reject({ error: queryParams.error })
      }

      if (queryParams.state !== this.getState()) {
        return reject({ error: "Invalid State" })
      }

      return resolve(queryParams)
    })
  }

  /**
   * Get the storage (sessionStorage / localStorage) to use, defaults to sessionStorage
   * @return {Storage}
   */
  getStore() {
    return this.config?.storage || sessionStorage
  }
}

export { PKCE }