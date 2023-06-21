## Testing Overview

Tests are executed using the [`Jest`](https://jestjs.io/) framework.  The test suites also rely on the [`fetch-mock`](https://www.npmjs.com/package/fetch-mock) and [`fetch-mock-jest`](https://www.npmjs.com/package/fetch-mock-jest) packages for isolation of functions under test that make calls to the fetch API.

`Jest` runs on Node; Node 18+ is recommended to run these tests, since it has a native fetch API.  The `fetch-mock` package does not use the native fetch API, so the [`node-fetch`](https://www.npmjs.com/package/node-fetch) package *(v2.6.7)* is included as a dependency.  If running tests under an older version of Node, you will need to update the `fetchwrapper.js` source file to include the `node-fetch` package.

The `Jest`, `fetch-mock`, `fetch-mock-jest` packages are included as dev dependencies.  The `@babel/plugin-transform-modules-commonjs` package and the `.babelrc` file in the root of this repo are also required for Jest to function properly, since the project modules are written in ES6 syntax.  There's also a couple other utility packages installed for development purposes.


### Testing Configuration

The file `jest.config.js` in the repo root contains some parameters that need to be configured for your environment.  There are mock tests that isolate functions from making real fetch calls over the network; there are also tests that permit the functions to execute fetch calls over the network.

These lines enable/disable real fetch API tests and mock fetch API tests, respectively: 
```
    LIVE_TESTS_ENABLED: true,
    MOCK_TESTS_ENABLED: true
```

These lines set configuration for live host URLs and mock host URLs.  Configure `LIVE_SDB_HOST` to point to your test SlashDB host.  `MOCK_HOST` can remain as is.
```
    LIVE_SDB_HOST = 'http://<SLASHDBHOST:PORT>'
    MOCK_HOST = 'http://localhost'
```

This line is for setting the SlashDB admin user's API key:
```
    LIVE_SDB_API_KEY: '<APIKEYHERE>'
```

This line is for setting the SlashDB database to test with:
```
    SDB_TEST_DB_NAME: 'Chinook'
```
    
### Running Tests

Once Node is installed, packages have been installed, and the lines above have been set for your environment, you can run all test suites using the command:

`npm test`

To test only a specific module, specify the test script, e.g. :

`npm test  -- fetchWrapper.test.js`
