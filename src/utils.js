import { SHA256 } from './crypto-js/sha256.js';
import { Base64 } from './crypto-js/enc-base64.js';

function getUrlParms(){
    let url = window.location.hash;

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

export { generateRandomString, generateCodeChallenge, getUrlParms }