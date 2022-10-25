# slashdb-js
This repository contains JavaScript ES6 modules with classes and functions to create applications for SlashDB.  Use this SDK directly if you're building a JavaScript application that needs to interact with SlashDB.  If you're building a React application, you can use the [SlashDB React SDK](https://github.com/SlashDB/react-slashdb), which contains out-of-the-box hooks to build React-based applications with SlashDB.  For other frameworks or pure JavaScript solutions, this SDK provides the developer with tools to use the following [SlashDB features](https://www.slashdb.com/how-it-works/):

* **SlashDB application configuration** _(partial; currently limited to R/O operations)_
* **Data Discovery**
     * GET/POST/PUT/DELETE calls
     * all Data Discovery options, e.g. filtering, relations, sorting, stream, accept types, etc
* **SQL Pass-Thru**
     * GET/POST/PUT/DELETE calls
     * all SQL Pass-Thru options, e.g. query parameters, sorting, stream, accept types, etc
 * **Functions for creating SlashDB-compatible filters**

A brief explanation of each module:

* `modules/slashdbclient.js` : contains a class for connecting to SlashDB and retrieving configuration information
* `modules/datadiscovery.js` : contains classes for making Data Discovery REST calls
* `modules/datadiscoveryfilter.js` : contains a class for creating Data Discovery URL endpoints, including all the Data Discovery options
* `modules/sqlpassthru.js` : contains a class for executing SQL Pass-Thru queries
* `modules/sqlpassthrufilter.js` : contains a class for creating SQL Pass-Thru URL endpoints, including all the SQL Pass-Thru options
* `modules/filterfunctions.js` : a set of functions to create SlashDB-compatible filters
* `modules/basefilter.js` : an underlying class used by other classes _(not necessary to import directly into your code)_
* `modules/baserequesthandler.js` : an underlying class used by other classes _(not necessary to import directly into your code)_
* `modules/fetchwrapper.js` : underlying functions for fetching data used by other modules _(not necessary to import directly into your code)_

[Full documentation of the modules can be found here](https://github.com/SlashDB/slashdb-js/tree/main/jsdocs).  Clone this repo and open the jsdocs/index.html file to browse.

There is also a small demo application in this repository.  To use it _(assumes you have Node installed, v17.5+ recommended)_ :
* Clone this repository to your system
* Run `npm install`
* Run `npm run localserver` _(starts an HTTP server on port 8080)_
* Navigate in a browser to http://localhost:8080/demo.html
* Open the developer console to see a few more details in the demo

Note that administrative features of the demo will be limited if you're using https://demo.slashdb.com as the host.  You can [set up your own SlashDB instance using Docker](https://docs.slashdb.com/user-guide/getting-slashdb/docker/), or there's a [number of other platforms that are also supported](https://docs.slashdb.com/user-guide/getting-slashdb/) if you want to try all the features.

For more info about SlashDB, visit www.slashdb.com.  You can [read the application documentation here](https://docs.slashdb.com/user-guide/).
