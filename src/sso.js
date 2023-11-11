import { PKCE } from './pkce.js';

import { generateCodeChallenge, generateRandomString, getUrlParms, popupCenter } from "./utils.js";

function isObjectEmpty(objectName) {
    return Object.keys(objectName).length === 0
}

function isSSOredirect(ssoParams) {

    if (isObjectEmpty(ssoParams)){
        return false;
    }

    const state = ssoParams.state;
    const sessionState = ssoParams.session_state;
    const code = ssoParams.code;

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
    let codeChallengeMethod = 'S256';
    let codeVerifier = generateRandomString(128);
    let codeChallenge = generateCodeChallenge(codeVerifier);
    let idpId = ssoConfig.idp_id;

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

    window.location.replace(pkce.authorizeUrl(additionalParams));

}

function JWTAuthentication(){

}

export { isSSOredirect, SSOlogin }