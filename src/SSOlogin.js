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

function SSOloginPopup(ssoConfig) {
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

    const width = 500;
    const height = 600;
    // const left = window.screen.width / 2 - width / 2;
    // const top = window.screen.height / 2 - height / 2;

    // const popupWindow = window.open(pkce.authorizeUrl(additionalParams), "login", `width=${width},height=${height},top=${top},left=${left}`);
    const popupWindow = popupCenter(pkce.authorizeUrl(additionalParams), "login", width, height);
    let self = this;

    const checkPopup = setInterval(() => {
        const popUpHref = popupWindow.window.location.href;
        console.log(popUpHref);
        if (popUpHref.startsWith(window.location.origin)) {
            popupWindow.close();
            const pkce = new PKCE(ssoConfig);
            pkce.codeVerifier = sessionStorage.getItem('ssoApp.code_verifier');
            pkce.exchangeForAccessToken(popUpHref).then((resp) => {
                console.log(resp);
                // this.idToken = btoa(resp.id_token);
                self.idpId = idpId;
                self.ssoCredentials = resp;
            });
        }
        if (!popupWindow || !popupWindow.closed) return;
        clearInterval(checkPopup);
        // window.location.replace(popUpHref);
    }, 50);

}

function JWTAuthentication(){

}

export { isSSOredirect, SSOlogin, SSOloginPopup }