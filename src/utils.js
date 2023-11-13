import { SHA256 } from './crypto-js/sha256.js';
import { Base64 } from './crypto-js/enc-base64.js';

function getUrlParms(url){
    if (!url){
        url = window.location.hash;
    }

    if (!url){
        return {}
    }
    const [hash, query] = url.split('#')[1].split('?');
    const urlParams = Object.fromEntries(new URLSearchParams(hash));

    return urlParams;
}

function base64URL (string) {
    return string.toString(Base64)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateRandomString(length) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function generateCodeChallenge(code_verifier) {
    return base64URL(SHA256(code_verifier));
}

const popupCenter = (url, title, w, h) => {
    // Fixes dual-screen position                             Most browsers      Firefox
    const dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;

    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = (width - w) / 2 / systemZoom + dualScreenLeft
    const top = (height - h) / 2 / systemZoom + dualScreenTop
    const newWindow = window.open(url, title, 
      `
      scrollbars=yes,
      width=${w / systemZoom}, 
      height=${h / systemZoom}, 
      top=${top}, 
      left=${left}
      `
    )

    if (window.focus) newWindow.focus();

    return newWindow;
}

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

export { generateRandomString, generateCodeChallenge, getUrlParms, popupCenter, isSSOredirect }