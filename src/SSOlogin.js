import PKCE from 'js-pkce';

import { generateCodeChallenge, generateRandomString } from "./utils";

function validateSSOredirect(ssoParams) {

    const idpId = ssoParams.get('idp_id');
    const state = ssoParams.get('state');
    const sessionState = ssoParams.get('session_state');
    const code = ssoParams.get('code');

    if (!idpId || typeof(idpId) !== 'string') {
        return false
    }

    if (!state || typeof(state) !== 'string') {
        return false
    }

    if (!sessionState || typeof(sessionState) !== 'string') {
        return false
    }

    if (!code || typeof(code) !== 'string') {
        return false
    }

    return true;

}

function getSDBAuthSettings(SDBConfig) {

    

}

function SSOlogin(ssoConfig) {
    let state = generateRandomString(128);
    let nonce = generateRandomString(128);
    let code_challenge_method = 'S256';
    let code_verifier = generateRandomString(128);
    let code_challenge = generateCodeChallenge(code_verifier);

    let qs = {
        'client_id': ssoConfig.client_id,
        'redirect_uri': utils.getRedirectUri(idp_id),
        'response_type': ssoConfig.response_type,
        'response_mode': 'fragment',
        'state': state,
        'nonce': nonce,
        'scope': ssoConfig.scope
    };

    if (ssoConfig.response_type === 'code') {
        qs['code_challenge'] = code_challenge;
        qs['code_challenge_method'] = code_challenge_method;
    }

    const pkce = new PKCE({
        client_id: 'myclientid',
        redirect_uri: 'http://localhost:8080/auth',
        authorization_endpoint: 'https://authserver.com/oauth/authorize',
        token_endpoint: 'https://authserver.com/oauth/token',
        requested_scopes: '*',
    });

    const additionalParams = {test_param: 'testing'};

    window.location.replace(pkce.authorizeUrl(additionalParams));

}

function JWTAuthentication(){

}

export { validateSSOredirect }