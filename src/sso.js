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

export { isSSOredirect }