import fetchMock from 'fetch-mock-jest';
import { SlashDBClient } from '../src/slashdbclient.js';
import { fetchWrapper } from '../src/fetchwrapper.js';
import { SQLPassThruQuery } from '../src/sqlpassthru.js';

const testIf = (condition, ...args) =>
  condition ? test(...args) : test.skip(...args);


beforeAll( () => {
    // disable console errors, warns
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach( () => {
    fetchMock.mockReset();
});

afterAll( async () => {
    // delete the record created by the POST test
    try {
        let r = await fetchWrapper("DELETE", `${LIVE_SDB_HOST}/db/${SDB_TEST_DB_NAME}/Customer/FirstName/SQLPassThruPOST`);
    }
    catch(e) {
        null;
    }
});

describe('SQLPassThruQuery() class tests', () => {

    const mockConfig = {
        host: MOCK_HOST
    };

    const liveConfig = {
        host: LIVE_SDB_HOST,
        apiKey: LIVE_SDB_API_KEY
    };

    const mockClient = new SlashDBClient(mockConfig);
    const liveClient = new SlashDBClient(liveConfig);
    
    const invoices2010 = 
    [
        {
            "InvoiceId": 84,
            "CustomerId": 43,
            "InvoiceDate": "2010-01-08 00:00:00",
            "BillingAddress": "68, Rue Jouvence",
            "BillingCity": "Dijon",
            "BillingState": null,
            "BillingCountry": "France",
            "BillingPostalCode": "21000",
            "Total": 1.98
        },
        {
            "InvoiceId": 85,
            "CustomerId": 45,
            "InvoiceDate": "2010-01-08 00:00:00",
            "BillingAddress": "Erzs\u00e9bet krt. 58.",
            "BillingCity": "Budapest",
            "BillingState": null,
            "BillingCountry": "Hungary",
            "BillingPostalCode": "H-1073",
            "Total": 1.98
        },
        {
            "InvoiceId": 86,
            "CustomerId": 47,
            "InvoiceDate": "2010-01-09 00:00:00",
            "BillingAddress": "Via Degli Scipioni, 43",
            "BillingCity": "Rome",
            "BillingState": "RM",
            "BillingCountry": "Italy",
            "BillingPostalCode": "00192",
            "Total": 3.96
        }
    ];

    test('testing: constructor()', () => {

        // simplest constructor - query name and client object
        let testSPTQ = new SQLPassThruQuery('invoices-by-year',mockClient)
        expect(testSPTQ).toHaveProperty('queryPrefix');
        expect(testSPTQ.queryPrefix).toBe('/query/');
        expect(testSPTQ).toHaveProperty('sdbClient');
        expect(testSPTQ.sdbClient).toBeInstanceOf(SlashDBClient)

        // method and params provided
        testSPTQ = new SQLPassThruQuery('invoices-by-year',mockClient,{GET:true,POST:true},['param1','param2'])
        expect(testSPTQ).toHaveProperty('methods');
        expect(testSPTQ.methods).toStrictEqual({GET:true,POST:true});
        expect(testSPTQ).toHaveProperty('params');
        expect(testSPTQ.params).toStrictEqual(['param1','param2']);        


        // ERROR cases
        expect(() => {
            result = new SQLPassThruQuery();
        }).toThrowError();

        // no query name given
        expect(() => {
            result = new SQLPassThruQuery(undefined,mockClient);
        }).toThrowError();

        // no client object provided
        expect(() => {
            result = new SQLPassThruQuery('invoices-by-year');
        }).toThrowError();        

        // non-strings for query name
        expect(() => {
            result = new SQLPassThruQuery(123,mockClient);
        }).toThrowError();          

        // non-SlashDBClient object for client object
        expect(() => {
            result = new SQLPassThruQuery('invoices-by-year',{a:'1'});
        }).toThrowError();          

    });

    test('testing: accept() method', () => {
        let testSPTQ = new SQLPassThruQuery('invoices-by-year',mockClient);
        expect(testSPTQ).toHaveProperty('acceptHeader');
        expect(testSPTQ.acceptHeader).toBe('application/json');
        testSPTQ.accept('csv');
        expect(testSPTQ.acceptHeader).toBe('text/csv');
        testSPTQ.accept('application/xml');
        expect(testSPTQ.acceptHeader).toBe('application/xml');

        // ERROR cases
        expect(() => {
            testSPTQ.accept();
        }).toThrowError();  

        // non-string parameter
        expect(() => {
            testSPTQ.accept(1);
        }).toThrowError();  

    });

    test('testing: contentType() method', () => {
        let testSPTQ = new SQLPassThruQuery('invoices-by-year',mockClient);
        expect(testSPTQ).toHaveProperty('acceptHeader');
        expect(testSPTQ.contentTypeHeader).toBe('application/json');
        testSPTQ.contentType('csv');
        expect(testSPTQ.contentTypeHeader).toBe('text/csv');
        testSPTQ.contentType('application/xml');
        expect(testSPTQ.contentTypeHeader).toBe('application/xml');        

        // ERROR cases
        expect(() => {
            testSPTQ.contentType();
        }).toThrowError();  

        // non-string parameter
        expect(() => {
            testSPTQ.contentType(1);
        }).toThrowError();  

    });

    test('testing: extraHeaders() method', () => {

        const testHeader = {
            'key1':'value1',
            'key2':'value2',
            'key3':'value3',
        }

        let testSPTQ = new SQLPassThruQuery('invoices-by-year',mockClient);
        expect(testSPTQ).toHaveProperty('extraHeaders')
        expect(testSPTQ.extraHeaders).toEqual({})

        // can set initial keys
        testSPTQ.setExtraHeaders(testHeader)
        expect(testSPTQ.extraHeaders).toEqual(testHeader)
        
        // can add keys
        testHeader['key4'] = 'value4'
        testSPTQ.setExtraHeaders({'key4':'value4'})
        expect(testSPTQ.extraHeaders).toEqual(testHeader)

        // values can be numbers
        testHeader['key5'] = 5
        testSPTQ.setExtraHeaders({'key5':5})
        expect(testSPTQ.extraHeaders).toEqual(testHeader)


        // ERROR cases
        // empty param
        expect(() => {
            testSPTQ.setExtraHeaders()
        }).toThrowError();  
        
        // non-string/number values
        expect(() => {
            const badObj = {'arrayKey':[]}
            testSPTQ.setExtraHeaders(badObj)
        }).toThrowError();  

        
    });

    testIf(MOCK_TESTS_ENABLED, 'testing: get() mock tests', async () => {

        fetchMock
            .get(`${MOCK_HOST}/query/invoices-by-year/year/2010`, invoices2010)
            .get(`${MOCK_HOST}/query/InvalidQuery`, 404 )
            .get(`${MOCK_HOST}/query/ForbiddenQuery`, (url, options) => {
                if (!options.headers.apiKey) {
                    return 403;
                }
                return 200;
            });

        let testSPTQ = new SQLPassThruQuery('invoices-by-year',mockClient);
        let r = await testSPTQ.get('year/2010');
        expect(r.data).toStrictEqual(invoices2010)
        expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/query/invoices-by-year/year/2010`);

        // get a non-existent resource - 404
        try {
            let testSPTQ = new SQLPassThruQuery('InvalidQuery',mockClient);
            await  testSPTQ.get();
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/query/InvalidQuery`);
            expect(e.message).toBe('404');
        }

        // get a forbidden resource - 403
        try {
            mockClient['apiKey'] = undefined;
            let testSPTQ = new SQLPassThruQuery('ForbiddenQuery',mockClient);
            await  testSPTQ.get();
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/query/ForbiddenQuery`);
            expect(e.message).toBe('403');
            mockClient['apiKey'] = '1234';
        }

        // // get a resource in a non-existent format - 406
        // try {
        //     let testDDR = new SQLPassThruQuery('/userdef/admin','deleteme',mockClient) 
        //     testDDR.dbPrefix = '';
        //     testDDR.resourceName = '';    
        //     await testDDR.get();            
        // }
        // catch(e) {
        //     expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/userdef/admin`);
        //     expect(e.message).toBe('406');
        // }
       
    });


     testIf(LIVE_TESTS_ENABLED, 'testing: get() live tests', async () => {

        try {
            let testSPTQ = new SQLPassThruQuery('invoices-by-year',liveClient);
            let r = await testSPTQ.get('/year/2010.json?limit=3');
            expect(r.data).toStrictEqual(invoices2010)
        }
        catch(e) {
            throw Error(e)
        }

        // 404 error - non-existent resource
        try {
            let testSPTQ = new SQLPassThruQuery('InvalidQuery',liveClient);           
            await testSPTQ.get();
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // 400 error - non-existent column in resource
        try {
            let testSPTQ = new SQLPassThruQuery('invoices-by-year',liveClient);          
            await testSPTQ.get('/invalidParam/2010');
        }
        catch(e) {
            expect(e.message).toBe('400');
        }

        try {
            liveClient.logout();
            liveClient.apiKey = '';
            let testSPTQ = new SQLPassThruQuery('invoices-by-year',liveClient);
            await testSPTQ.get('/year/2010');
        }
        catch(e) {
            expect(e.message).toBe('403');
        }
        finally {
            liveClient.apiKey = LIVE_SDB_API_KEY;
        }
    });


    testIf(MOCK_TESTS_ENABLED, 'testing: post() mock tests', async () => {

        let newCustomer = {
            "FirstName": "SQLPassThruPOST",
            "LastName": "Test",
            "City": "Seattle",
            "State": "WA",
            "Phone": "+1 (555) 555-5555",
            "Email": "user@testcompany.com",
        }

        fetchMock
            .post(`${MOCK_HOST}/query/add-new-customer`, (url, options) => {
                let b = JSON.parse(options.body)
                if (!options.headers.apiKey) {
                        return 403;
                    }

                if (b.hasOwnProperty('nonExistentField')) {
                    return 400;
                }

            return 201;
            })
            .post(`${MOCK_HOST}/query/InvalidQuery`, 404)

        // valid query using POST
        let testSPTQ = new SQLPassThruQuery('add-new-customer', mockClient);        
        let r = await testSPTQ.post(newCustomer);
        expect(r.res.status).toBe(201);
        expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/query/add-new-customer`);

        // non-existent query
        try {
            let testSPTQ = new SQLPassThruQuery('InvalidQuery', mockClient);        
            let r = await testSPTQ.post(newCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/query/InvalidQuery`);
            expect(e.message).toBe('404');
        }

        // query w/o auth - 403
        try {
            mockClient.sdbConfig.apKey = null; 
            await testSPTQ.post(newCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/query/add-new-customer`);
            expect(e.message).toBe('403');
            mockClient.sdbConfig.apKey = '1234';             
        }

        // query with invalid params - 400
        try {
            newCustomer['nonExistentField'] = 'invalidValue';
            await testSPTQ.post(newCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/query/add-new-customer`);
            expect(e.message).toBe('400');
            newCustomer['nonExistentField'] = undefined;
        }

      
    });    

    testIf(LIVE_TESTS_ENABLED, 'testing: post() live tests', async () => {

        let newCustomer = {
            "FirstName": "SQLPassThruPOST",
            "LastName": "Test",
            "City": "Seattle",
            "State": "WA",
            "Phone": "+1 (555) 555-5555",
            "Email": "user@testcompany.com",
        }

        // valid query using POST
        try {
            let testSPTQ = new SQLPassThruQuery('add-new-customer',liveClient);
            let r = await testSPTQ.post(newCustomer);
            expect(r.res.status).toBe(200);
        }
        catch(e) {
            throw Error(e);
        }

        // non-existent query - 404
        try {
            let testSPTQ = new SQLPassThruQuery('InvalidQuery',liveClient);
            let r = await testSPTQ.post(newCustomer);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // no auth for query - 403
        try {
            liveClient.logout();
            liveClient.apiKey = '';
            let testSPTQ = new SQLPassThruQuery('add-new-customer',liveClient);
            let r = await testSPTQ.post(newCustomer);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }
        finally {
            liveClient.apiKey = LIVE_SDB_API_KEY;
        }
    });    

    
    // testIf(MOCK_TESTS_ENABLED, 'testing: put() mock tests', async () => {

    //     let updateCustomer = {
    //         "FirstName": "PUT",
    //         "LastName": "Test",
    //         "City": "Boston",
    //         "State": "MA",
    //         "Phone": "+1 (555) 555-5555",
    //         "Email": "user@putcompany.com",
    //     }

    //     fetchMock
    //         .put(`${MOCK_HOST}/query/add-new-customer/`, (url, options) => {
    //             let b = JSON.parse(options.body)
    //             if (!options.headers.apiKey) {
    //                     return 403;
    //                 }

    //             if (b.hasOwnProperty('nonExistentField')) {
    //                 return 400;
    //             }

    //         return 201;
    //         })
    //         .put(`${MOCK_HOST}/query/add-new-customer/`, 404)

    //     // update a record
    //     let testSPTQ = new SQLPassThruQuery('add-new-customer',liveClient) 
    //     let r = await testSPTQ.put('', updateCustomer);
    //     expect(r.res.status).toBe(201)
    //     expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/Customer/FirstName/POST`);

    //     // update a non-existent record - 404
    //     try {
    //         await testDDR.put('InvalidResource/FirstName/POST', updateCustomer);
    //     }
    //     catch(e) {
    //         expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/Customer/InvalidResource/FirstName/POST`);
    //         expect(e.message).toBe('404');
    //     }

    //     // create a new record w/o auth - 403
    //     try {
    //         mockClient.sdbConfig.apKey = null;   
    //         await testDDR.put('FirstName/POST', updateCustomer);
            
    //     }
    //     catch(e) {
    //         expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/Customer/FirstName/POST`);
    //         expect(e.message).toBe('403');
    //         mockClient.sdbConfig.apiKey = '1234';
    //     }

    //     // update a record with non-existent fields for given resource - 400
    //     try {
    //         updateCustomer['nonExistentField'] = 'invalidValue';
    //         await testDDR.put('FirstName/POST', updateCustomer);
    //     }
    //     catch(e) {
    //         expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/Customer/FirstName/POST`);
    //         expect(e.message).toBe('400');
    //         updateCustomer['nonExistentField'] = undefined;
    //     }

        
    // });    

    // testIf(LIVE_TESTS_ENABLED, 'testing: put() live tests', async () => {

    //     let updateCustomer = {
    //         "FirstName": "PUT",
    //         "LastName": "Test",
    //         "Company": "PUTCompany",
    //         "Address": "456 Ave",
    //         "City": "Boston",
    //         "State": "MA",
    //         "Country": "USA",
    //         "PostalCode": "12345",
    //         "Phone": "+1 (555) 555-5555",
    //         "Email": "user@putcompany.com",
    //     }

    //     // valid resource to update
    //     try {
    //         let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'Customer',liveClient)    
    //         let r = await testDDR.put('FirstName/POST', updateCustomer);            
    //         expect(r.res.status).toBe(204)
    //     }
    //     catch(e) {
    //         throw Error(e)
    //     }

    //     // non-existent record - 404
    //     try {
    //         let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'InvalidResource',liveClient)    
    //         let r = await testDDR.put('FirstName/POST', updateCustomer);  
    //     }
    //     catch(e) {
    //         expect(e.message).toBe('404');
    //     }

    //     // non-existent column in record - 400
    //     try {
    //         let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'Customer',liveClient)    
    //         let r = await testDDR.put('InvalidResource/POST', updateCustomer);  
    //     }
    //     catch(e) {
    //         expect(e.message).toBe('400');
    //     }

    //     // no auth to update record - 403
    //     try {
    //         liveClient.apiKey = '';
    //         let testDDR = new SQLPassThruQuery('/userdef','deleteme',liveClient) 
    //         testDDR.dbPrefix = '';
    //         testDDR.resourceName = '';
    //         let r = await testDDR.put('admin',updateCustomer);  
    //     }
    //     catch(e) {
    //         expect(e.message).toBe('403');
    //     }            

    // });        

    // testIf(MOCK_TESTS_ENABLED, 'testing: delete() mock tests', async () => {

    //     fetchMock
    //         .delete(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/Customer/FirstName/PUT`, (url, options) => {
    //             if (!options.headers.apiKey) {
    //                     return 403;
    //                 }

    //         return 204;
    //         })
    //         .delete(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/InvalidResource/FirstName/PUT`, 404)
    //         .delete(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/Customer/InvalidResource/FirstName/PUT`, 400)

    //     // delete a record
    //     let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'Customer',mockClient)    
    //     let r = await testDDR.delete('FirstName/PUT');
    //     expect(r.res.status).toBe(204)
    //     expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/Customer/FirstName/PUT`);

    //     // delete a non-existent record - 404
    //     try {
    //         let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'InvalidResource',mockClient)    
    //         let r = await testDDR.delete('FirstName/PUT');
    //     }
    //     catch(e) {
    //         expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/InvalidResource/FirstName/PUT`);
    //         expect(e.message).toBe('404');
    //     }

    //     // non-existent column in record - 400
    //     try {
    //         let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'Customer',mockClient)    
    //         let r = await testDDR.delete('InvalidResource/FirstName/PUT');
    //     }
    //     catch(e) {
    //         //expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/Customer/InvalidResource/FirstName/PUT`);
    //         expect(e.message).toBe('400');
    //     }

    //     // delete a record w/o auth - 403
    //     try {
    //         mockClient.apiKey = '';
    //         let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'Customer',mockClient) 
    //         await testDDR.delete('FirstName/PUT');
    //     }
    //     catch(e) {
    //         expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/${SDB_TEST_DB_NAME}/Customer/FirstName/PUT`);
    //         expect(e.message).toBe('403');
    //         mockClient.apiKey = '1234';
    //     }

    // });    

    // testIf(LIVE_TESTS_ENABLED, 'testing: delete() live tests', async () => {

    //     // valid resource to delete
    //     try {
    //         let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'Customer',liveClient)    
    //         let r = await testDDR.delete('FirstName/PUT');                    
    //         expect(r.res.status).toBe(204)
    //     }
    //     catch(e) {
    //         throw Error(e)
    //     }

    //     // non-existent record - 404
    //     try {
    //         let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'InvalidResource',liveClient)    
    //         await testDDR.delete();   
    //     }
    //     catch(e) {
    //         expect(e.message).toBe('404');
    //     }

    //     // non-existent column in record - 400
    //     try {
    //         let testDDR = new SQLPassThruQuery(SDB_TEST_DB_NAME,'Customer',liveClient)    
    //         await testDDR.delete('InvalidResource');   
    //     }
    //     catch(e) {
    //         expect(e.message).toBe('400');
    //     }

    //     // no auth to update record - 403
    //     try {
    //         liveClient.apiKey = '';
    //         let testDDR = new SQLPassThruQuery('/userdef','deleteme',liveClient) 
    //         testDDR.dbPrefix = '';
    //         testDDR.resourceName = '';
    //         await testDDR.delete('admin');               
    //     }
    //     catch(e) {
    //         expect(e.message).toBe('403');
    //     }            

    // });            
});

