const crypto = require('crypto');

Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: arr => crypto.randomBytes(arr.length),
    subtle: crypto.webcrypto.subtle
  }
});

// require('jest-fetch-mock').enableMocks();
// const fetchMock = require('fetch-mock-jest');