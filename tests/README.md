## Testing Overview

Tests are executed using the [```Jest```](https://jestjs.io/) framework.  The test suites also rely on the [```fetch-mock```](https://www.npmjs.com/package/fetch-mock) package for isolation of functions under test that make calls to the fetch API.

```Jest``` runs on Node; Node 17.5+ is required to run these tests, since the native fetch API is used.  To run tests under an older version of Node, you would need to install the [```node-fetch```](https://www.npmjs.com/package/node-fetch) package separately; however, the unit tests that make use of ```fetch-mock``` probably will not work without some tinkering to the source files.

The ```Jest``` and ```fetch-mock``` packages are included as dev dependencies.  The ```@babel/plugin-transform-modules-commonjs``` package and the ```.babelrc``` file in the root of this repo are also included for Jest to function properly, since the project modules are created using ES6 syntax.  There's also a couple other utility packages installed for development purposes.


### Testing Configuration

The test scripts responsible for testing modules that include fetch API calls have a few lines of code near the top of each script that must be configured for your environment.  There are mock tests that isolate functions from making real fetch calls over the network; there are also tests that permit the functions to execute fetch calls over the network.

These lines enable/disable real fetch API tests and mock fetch API tests, respectively: 
```
    const liveTestsEnabled = true;
    const mockTestsEnabled = true;
```

These lines set configuration for live host URLs and mock host URLs.  Configure ```liveSdbHost``` to point to your test SlashDB host.  ```mockHost``` can remain as is unless you have a service running on port 9999 of your local system:
```
    const liveSdbHost = 'http://<SLASHDBHOST:PORT>'; 
    const mockHost = 'http://localhost:9999';
```

These lines create client connection objects for testing; only ```liveClient``` will need to be changed here, to reflect your SlashDB environment's admin user API key:
```
    const mockClient = new SlashDBClient(mockHost,'admin','1234');
    const liveClient = new SlashDBClient(liveSdbHost,'admin','APIKEYHERE');
```

### Running Tests

Once Node is installed, packages have been installed, and the lines above have been set for your environment, you can run all test suites using the command:

```npm test```

To test only a specific module, specify the test script, e.g. :

```npm test  -- fetchWrapper.test.js```
