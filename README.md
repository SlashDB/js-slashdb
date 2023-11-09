# [js-slashdb](https://github.com/SlashDB/js-slashdb)
[This repository](https://github.com/SlashDB/js-slashdb) contains JavaScript ES6 modules with classes and functions to create applications for SlashDB.  Use this SDK directly if you're building a JavaScript application that needs to interact with SlashDB.  If you're building a React application, you can use the [SlashDB React SDK](https://github.com/SlashDB/react-slashdb), which contains out-of-the-box hooks to build React-based applications with SlashDB.  For other frameworks or pure JavaScript solutions, this SDK provides the developer with tools to use the following [SlashDB features](https://www.slashdb.com/how-it-works/):

* **SlashDB application configuration** _(partial; currently limited to R/O operations)_
* **Data Discovery**
     * GET/POST/PUT/DELETE calls
     * all Data Discovery options, e.g. filtering, relations, sorting, stream, accept types, etc
* **SQL Pass-Thru**
     * GET/POST/PUT/DELETE calls
     * all SQL Pass-Thru options, e.g. query parameters, sorting, stream, accept types, etc
 * **Functions for creating SlashDB-compatible filters**


## Installation
To install the SDK in your application's folder using Node:
* Run `npm install @slashdb/js-slashdb`

When using `npm` to start your application, you can import all the classes/functions from the repository package:  

```js
import { 
  SlashDBClient, 
  DataDiscoveryDatabase, DataDiscoveryResource, DataDiscoveryFilter, 
  SQLPassThruQuery, SQLPassThruFilter, 
  eq, any, between, gte, lte, not, and, asc, desc, chgPlaceHolder
} from '@slashdb/js-slashdb';
```

Or import them separately:
```js
`import { SlashDBClient } from '@slashdb/js-slashdb/src/slashdbclient.js';`
`import { DataDiscoveryResource, DataDiscoveryDatabase } from '@slashdb/js-slashdb/src/datadiscovery.js';`
`import { DataDiscoveryFilter } from '@slashdb/js-slashdb/src/datadiscoveryfilter.js';`
`import { SQLPassThruQuery } from '@slashdb/js-slashdb/src/sqlpassthru.js';`
`import { SQLPassThruFilter } from '@slashdb/js-slashdb/src/sqlpassthrufilter.js';`
`import { eq, any, between, gte, lte, not, and, chgPlaceHolder, asc, desc } from '@slashdb/js-slashdb/src/filterfunctions.js';`
```

If you aren't using `npm`, just reference the files in the `src` folder, e.g.:  

```js
import { 
  SlashDBClient, 
  DataDiscoveryDatabase, DataDiscoveryResource, DataDiscoveryFilter, 
  SQLPassThruQuery, SQLPassThruFilter, 
  eq, any, between, gte, lte, not, and, asc, desc, chgPlaceHolder 
} from './src/index.js';
```

A brief explanation of each module:

* `src/slashdbclient.js` : contains a class for connecting to SlashDB and retrieving configuration information
* `src/datadiscovery.js` : contains classes for making Data Discovery REST calls
* `src/datadiscoveryfilter.js` : contains a class for creating Data Discovery URL endpoints, including all the Data Discovery options
* `src/sqlpassthru.js` : contains a class for executing SQL Pass-Thru queries
* `src/sqlpassthrufilter.js` : contains a class for creating SQL Pass-Thru URL endpoints, including all the SQL Pass-Thru options
* `src/filterfunctions.js` : a set of functions to create SlashDB-compatible filters
* `src/basefilter.js` : an underlying class used by other classes _(not necessary to import directly into your code)_
* `src/baserequesthandler.js` : an underlying class used by other classes _(not necessary to import directly into your code)_
* `src/fetchwrapper.js` : underlying functions for fetching data used by other modules _(not necessary to import directly into your code)_

[Full documentation of the modules can be found here](https://slashdb.github.io/js-slashdb/docs).


## SDK Quick Start
To get up and running with the SDK, here's a quick example:

```js
const sdbConfig = {
  host: 'https://demo.slashdb.com',
  username: 'test',
  password: '********'
}
const sdbClient = new SlashDBClient();                                // create a SlashDB client to connect to a SlashDB instance
sdbClient.login();                                                    // login to host SlashDB server (Not required if api key is provided)
const db = new DataDiscoveryDatabase(sdb1,'Chinook');                 // access the Chinook Database that is on the SlashDB instance
const customerTable = new DataDiscoveryResource(db,'Customer');       // access the Customer table in the Chinook database
const query = new SQLPassThruQuery('invoices-total-range',sdbClient); // access the invoices-total-range query that is on the SlashDB instance

const ddFilter = new DataDiscoveryFilter()                            // create a filter for Data Discovery operations
               .addFilter(any('FirstName','J*,H*'))                   // filter by column FirstName, starting with 'J' or 'H'
               .addFilter(eq('Country','USA'))                        // filter by column Country, matches 'USA'
               .sort('LastName',desc('FirstName'))                    // sort results by columns LastName, descending FirstName
               .cols('FirstName','LastName','Company');               // only return columns FirstName, LastName, Company

const sptFilter = new SQLPassThruFilter( { 'mintotal': 10, 'maxtotal': 20 } )   // create a filter for SQL Pass-Thru with these query parameters set
                .limit(3)                                                       // return only the first 3 results
                .sort('CustomerId');                                            // sort results by column CustomerId

let dd_results = await customerTable.get(ddFilter);                   // get the data from Customer table with the Data Discovery filter options applied (returns JSON)
let spt_results = await query.accept('csv').get(sptFilter);           // execute the invoices-total-range query with the SQL Pass-Thru filter options applied (returns CSV)
```

There's more examples in the demo application.

All the [DataDiscovery/SQL Pass-Thru options in the documentation](https://docs.slashdb.com/user-guide/using-slashdb/) are supported.  The [SDK module documentation](https://slashdb.github.io/js-slashdb/docs) lists all the methods available.  


## Demo Application

There is a small demo application in this repository.  To use it _(assumes using Node, v18+ recommended)_ :
* Clone this repository to your system and open a shell in the repo folder 
* Run `npm install`
* Run `npm run localserver` _(starts an HTTP server on port 8081)_
* Navigate in a browser to http://localhost:8081/examples/demo.html
* Open the developer console to see a few more operations in the demo.  You can also use any of the classes/functions in the developer console.

Note that administrative features of the demo will be limited if you're using https://demo.slashdb.com as the host.  You can [set up your own SlashDB instance using Docker](https://docs.slashdb.com/user-guide/getting-slashdb/docker/), or there's a [number of other platforms that are also supported](https://docs.slashdb.com/user-guide/getting-slashdb/) if you want to try all the features.

## SlashDB - REST API to Databases for Reading & Writing

For more info about SlashDB, visit [https://www.slashdb.com](https://www.slashdb.com). 

The complete SlashDB documentation is available at [https://docs.slashdb.com](https://docs.slashdb.com).


