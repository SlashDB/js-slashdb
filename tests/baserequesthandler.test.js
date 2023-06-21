import fetchMock from 'fetch-mock-jest';
import { SlashDBClient } from '../src/slashdbclient.js';
import { fetchWrapper } from '../src/fetchwrapper.js';
import { BaseRequestHandler } from '../src/baserequesthandler.js';

const testIf = (condition, ...args) =>
  condition ? test(...args) : test.skip(...args);


  beforeAll( () => {
    // disable console errors, warns
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    let testCustomer = {
        "FirstName": "BaseRequestTestRecord",
        "LastName": "NewRecord",
        "Company": "TestCompany",
        "Address": "123 Street",
        "City": "Seattle",
        "State": "WA",
        "Country": "USA",
        "PostalCode": "58501",
        "Phone": "+1 (555) 555-5555",
        "Email": "user@testcompany.com",
    }

    // add a record to Chinook database Customer table for PUT/DELETE tests
    fetchWrapper("POST", `${LIVE_SDB_HOST}/db/${TEST_DB_NAME}/Customer`, testCustomer, {'Content-Type': 'application/json'});
    
    });

    afterEach( () => {
        fetchMock.mockReset();
    });


    afterAll( async () => {
        // delete the record created by the POST test
        try {
            let r = await fetchWrapper("DELETE", `${LIVE_SDB_HOST}/db/${TEST_DB_NAME}/Customer/FirstName/POSTTest`);
        }
        catch(e) {
            null;
        }
        // delete the record created before tests ran if DELETE test failed to delete it
        try {
            let r = await fetchWrapper("DELETE", `${LIVE_SDB_HOST}/db/${TEST_DB_NAME}/Customer/FirstName/BaseRequestTestRecord`);
        }
        catch(e) {
            null;
        }
    });

describe('BaseRequestHandler() class tests', () => {

    const mockClient = new SlashDBClient(MOCK_HOST,'admin','1234');
    const liveClient = new SlashDBClient(LIVE_SDB_HOST,'admin', LIVE_SDB_API_KEY);
    
    test('testing: constructor()', () => {

        // simplest constructor - dbName and resourceName defined as strings, client object explicitly given
        let testBRH = new BaseRequestHandler(mockClient);
        expect(testBRH).toHaveProperty('sdbClient');
        expect(testBRH.sdbClient).toBeInstanceOf(SlashDBClient);

        // ERROR cases
        expect(() => {
            result = new BaseRequestHandler();
        }).toThrowError();

        // non-SlashDBClient object for client object
        expect(() => {
            result = new BaseRequestHandler({a:'1'});
        }).toThrowError();          

    });

    test('testing: accept() method', () => {
        let testBRH = new BaseRequestHandler(mockClient);
        expect(testBRH).toHaveProperty('acceptHeader');
        expect(testBRH.acceptHeader).toBe('application/json');
        testBRH.accept('csv');
        expect(testBRH.acceptHeader).toBe('text/csv');

        // ERROR cases
        expect(() => {
            testBRH.accept();
        }).toThrowError();  

        // non-string parameter
        expect(() => {
            testBRH.accept(1);
        }).toThrowError();  

    });

    test('testing: contentType() method', () => {
        let testBRH = new BaseRequestHandler(mockClient);
        expect(testBRH).toHaveProperty('contentTypeHeader');
        expect(testBRH.contentTypeHeader).toBe('application/json'); 
        testBRH.contentType('csv');
        expect(testBRH.contentTypeHeader).toBe('text/csv');

        // ERROR cases
        expect(() => {
            testBRH.contentType();
        }).toThrowError();  

        // non-string parameter
        expect(() => {
            testBRH.contentType(1);
        }).toThrowError();  
        
    });

    test('testing: extraHeaders() method', () => {

        const testHeader = {
            'key1':'value1',
            'key2':'value2',
            'key3':'value3',
        };

        let testBRH = new BaseRequestHandler(mockClient);
        expect(testBRH).toHaveProperty('extraHeaders');
        expect(testBRH.extraHeaders).toEqual({});

        // can set initial keys
        testBRH.setExtraHeaders(testHeader);
        expect(testBRH.extraHeaders).toEqual(testHeader);
        
        // can add keys
        testHeader['key4'] = 'value4';
        testBRH.setExtraHeaders({'key4':'value4'});
        expect(testBRH.extraHeaders).toEqual(testHeader);

        // values can be numbers
        testHeader['key5'] = 5;
        testBRH.setExtraHeaders({'key5':5});
        expect(testBRH.extraHeaders).toEqual(testHeader);


        // ERROR cases
        // empty param
        expect(() => {
            testBRH.setExtraHeaders();
        }).toThrowError();  
        
        // non-string/number values
        expect(() => {
            const badObj = {'arrayKey':[]}
            testBRH.setExtraHeaders(badObj);
        }).toThrowError();  

        
    });

    testIf(MOCK_TESTS_ENABLED, 'testing: get() mock tests', async () => {

        fetchMock
            .get(`${MOCK_HOST}/testEndPoint`, true)
            .get(`${MOCK_HOST}/testEndPoint/InvalidResource`, 404 )
            .get(`${MOCK_HOST}/testEndPoint/ForbiddenResource`, (url, options) => {
                if (!options.headers.apiKey) {
                    return 403;
                }
                return 200;
            })
            .get(`${MOCK_HOST}/userdef/admin`, 406 );

        let testBRH = new BaseRequestHandler(mockClient);
        let r = await testBRH.get('testEndPoint');
        expect(r.data).toBe(true);
        expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/testEndPoint`);

        // get a non-existent resource - 404
        try {
            let testBRH = new BaseRequestHandler(mockClient);
            await  testBRH.get('testEndPoint/InvalidResource');
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/testEndPoint/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // get a forbidden resource - 403
        try {
            mockClient['apiKey'] = undefined;
            let testBRH = new BaseRequestHandler(mockClient);
            await testBRH.get('testEndPoint/ForbiddenResource');
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/testEndPoint/ForbiddenResource`);
            expect(e.message).toBe('403');
            mockClient['apiKey'] = '1234';
        }

        // // get a resource in a non-existent format - 406
        // try {
        //     let testBRH = new DataDiscoveryResource('/userdef/admin','deleteme',mockClient) 
        //     testBRH.dbPrefix = '';
        //     testBRH.resourceName = '';    
        //     await testBRH.get();            
        // }
        // catch(e) {
        //     expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/userdef/admin`);
        //     expect(e.message).toBe('406');
        // }
       
    });


     testIf(LIVE_TESTS_ENABLED, 'testing: get() live tests', async () => {

        try {
            let testBRH = new BaseRequestHandler(liveClient);
            let r = await testBRH.get('/login');            
            expect(r.res.status).toBe(200);
        }
        catch(e) {
            throw Error(e);
        }

        // 404 error - non-existent resource
        try {
            let testBRH = new BaseRequestHandler(liveClient);
            await testBRH.get('/invalidURL');
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // 400 error - non-existent column in resource
        try {
            let testBRH = new BaseRequestHandler(liveClient)
            await testBRH.get(`/db/${TEST_DB_NAME}/Customer/InvalidResource`);
        }
        catch(e) {
            expect(e.message).toBe('400');
        }

        // get a resource in a non-existent format - 406
        try {
            let testBRH = new BaseRequestHandler(liveClient);
            await testBRH.get('/userdef/admin.html');
        }
        catch(e) {
            expect(e.message).toBe('406');
        }

    try {
        liveClient.apiKey = '';
        let testBRH = new BaseRequestHandler(liveClient);
        await testBRH.get('/userdef/admin');
    }
    catch(e) {
        expect(e.message).toBe('403');
    }    

    });


    testIf(MOCK_TESTS_ENABLED, 'testing: post() mock tests', async () => {

        let newCustomer = {
            "FirstName": "POSTTest",
            "LastName": "Test",
            "Company": "TestCompany",
            "Address": "123 Street",
            "City": "Seattle",
            "State": "WA",
            "Country": "USA",
            "PostalCode": "58501",
            "Phone": "+1 (555) 555-5555",
            "Email": "user@testcompany.com",
        }

        fetchMock
            .post(`${MOCK_HOST}/testEndPoint`, (url, options) => {
                let b = JSON.parse(options.body);
                if (!options.headers.apiKey) {
                        return 403;
                    }

                if (b.hasOwnProperty('nonExistentField')) {
                    return 400;
                }

                if (b.hasOwnProperty('CustomerId') && b.CustomerId === 1) {
                    return 409;
                }
                
            return 201;
            })
            .post(`${MOCK_HOST}/testEndPoint/InvalidResource`, 404)

        // create a new record
        let testBRH = new BaseRequestHandler(mockClient);
        let r = await testBRH.post(newCustomer,'testEndPoint');
        expect(r.res.status).toBe(201);
        expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/testEndPoint`);

        // create a record for a non-existent resource - 404
        try {
            await testBRH.post(newCustomer,'testEndPoint/InvalidResource');
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/testEndPoint/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // create a new record with non-existent fields for given resource - 400
        try {
            newCustomer['nonExistentField'] = 'invalidValue';
            await testBRH.post(newCustomer,'testEndPoint');
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/testEndPoint`);
            expect(e.message).toBe('400');
            newCustomer['nonExistentField'] = undefined;
        }

        // create a record that already exists - 409
        try {
            newCustomer['CustomerId'] = 1;
            await testBRH.post(newCustomer,'testEndPoint');
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/testEndPoint`);
            expect(e.message).toBe('409');
            newCustomer['CustomerId'] = undefined;
        }

        // create a new record w/o auth - 403
        try {
            mockClient.sdbConfig.apKey = null;            
            await testBRH.post(newCustomer,'testEndPoint');
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/testEndPoint`);
            expect(e.message).toBe('403');
            mockClient.sdbConfig.apKey = '1234';             
        }        
        
    });    

    testIf(LIVE_TESTS_ENABLED, 'testing: post() live tests', async () => {

        let newCustomer = {
            "FirstName": "POSTTest",
            "LastName": "Test",
            "Company": "TestCompany",
            "Address": "123 Street",
            "City": "Seattle",
            "State": "WA",
            "Country": "USA",
            "PostalCode": "58501",
            "Phone": "+1 (555) 555-5555",
            "Email": "user@testcompany.com",
        }

     

        // valid resource to create
        try {
            let testBRH = new BaseRequestHandler(liveClient);
            let r = await testBRH.post(newCustomer,`/db/${TEST_DB_NAME}/Customer`);
            expect(r.res.status).toBe(201)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent resource - 404
        try {
            let testBRH = new BaseRequestHandler(liveClient);
            let r = await testBRH.post(newCustomer,`/db/${TEST_DB_NAME}/InvalidResource`);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // create a record that already exists - 409
        try {
            newCustomer['CustomerId'] = 1
            let testBRH = new BaseRequestHandler(liveClient) 
            let r = await testBRH.post(newCustomer,`/db/${TEST_DB_NAME}/Customer`);
        }
        catch(e) {
            expect(e.message).toBe('409');
            newCustomer['CustomerId'] = undefined;
        }

        // no auth to create record - 403
        try {
            liveClient.apiKey = '';
            let testBRH = new BaseRequestHandler(liveClient) 
            let r = await testBRH.post(newCustomer,'/userdef');
        }
        catch(e) {
            expect(e.message).toBe('403');
        }               
    });    

    
    testIf(MOCK_TESTS_ENABLED, 'testing: put() mock tests', async () => {

        let updateCustomer = {
            "FirstName": "PUTTest",
            "LastName": "ChangedRecord",
            "Company": "PUTCompany",
            "Address": "456 Ave",
            "City": "Boston",
            "State": "MA",
            "Country": "USA",
            "PostalCode": "12345",
            "Phone": "+1 (555) 555-5555",
            "Email": "user@putcompany.com",
        }

        fetchMock
            .put(`${MOCK_HOST}/testEndPoint`, (url, options) => {
                let b = JSON.parse(options.body);
                if (!options.headers.apiKey) {
                        return 403;
                    }

                if (b.hasOwnProperty('nonExistentField')) {
                    return 400;
                }

                if (b.hasOwnProperty('CustomerId') && b.CustomerId === 1) {
                    return 409;
                }

            return 201;
            })
            .put(`${MOCK_HOST}/testEndPoint/InvalidResource`, 404);

        // update a record
        let testBRH = new BaseRequestHandler(mockClient);
        let r = await testBRH.put('testEndPoint', updateCustomer);
        expect(r.res.status).toBe(201);
        expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/testEndPoint`);

        // update a non-existent record - 404
        try {
            await testBRH.put('testEndPoint/InvalidResource', updateCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/testEndPoint/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // create a new record w/o auth - 403
        try {
            mockClient.sdbConfig.apKey = null;   
            await testBRH.put('testEndPoint', updateCustomer);
            
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/testEndPoint`);
            expect(e.message).toBe('403');
            mockClient.sdbConfig.apiKey = '1234';
        }

        // update a record with non-existent fields for given resource - 400
        try {
            updateCustomer['nonExistentField'] = 'invalidValue';
            await testBRH.put('testEndPoint', updateCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/testEndPoint`);
            expect(e.message).toBe('400');
            updateCustomer['nonExistentField'] = undefined;
        }

        
    });    

    testIf(LIVE_TESTS_ENABLED, 'testing: put() live tests', async () => {

        let updateCustomer = {
            "LastName": "ChangedRecord",

        }

        // valid resource to update
        try {
            let testBRH = new BaseRequestHandler(liveClient);
            let r = await testBRH.put(`/db/${TEST_DB_NAME}/Customer/FirstName/BaseRequestTestRecord`, updateCustomer);            
            expect(r.res.status).toBe(204);
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent record - 404
        try {
            let testBRH = new BaseRequestHandler(liveClient); 
            let r = await testBRH.put(`/db/${TEST_DB_NAME}/InvalidResource`, updateCustomer);  
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // non-existent column in record - 400
        try {
            let testBRH = new BaseRequestHandler(liveClient); 
            let r = await testBRH.put(`/db/${TEST_DB_NAME}/Customer/InvalidColumn/BaseRequestTestRecord`, updateCustomer);  
        }
        catch(e) {
            expect(e.message).toBe('400');
        }

        // no auth to update record - 403
        try {
            liveClient.apiKey = '';
            let testBRH = new BaseRequestHandler(liveClient); 
            let r = await testBRH.put('/userdef/admin',updateCustomer);  
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

    });        

    testIf(MOCK_TESTS_ENABLED, 'testing: delete() mock tests', async () => {

        fetchMock
            .delete(`${MOCK_HOST}/testEndPoint`, (url, options) => {
                if (!options.headers.apiKey) {
                        return 403;
                    }

            return 204;
            })
            .delete(`${MOCK_HOST}/testEndPoint/InvalidResource`, 404)
            .delete(`${MOCK_HOST}/testEndPoint/InvalidRequest`, 400)

        // delete a record
        let testBRH = new BaseRequestHandler(mockClient);    
        let r = await testBRH.delete('testEndPoint');
        expect(r.res.status).toBe(204);
        expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/testEndPoint`);

        // delete a non-existent record - 404
        try {
            let testBRH = new BaseRequestHandler(mockClient);
            let r = await testBRH.delete('testEndPoint/InvalidResource');
        }
        catch(e) {
            expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/testEndPoint/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // non-existent column in record - 400
        try {
            let testBRH = new BaseRequestHandler(mockClient);
            let r = await testBRH.delete('testEndPoint/InvalidRequest');
        }
        catch(e) {
            expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/testEndPoint/InvalidRequest`);
            expect(e.message).toBe('400');
        }

        // delete a record w/o auth - 403
        try {
            mockClient.apiKey = '';
            let testBRH = new BaseRequestHandler(mockClient);
            await testBRH.delete('testEndPoint');
        }
        catch(e) {
            expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/testEndPoint`);
            expect(e.message).toBe('403');
            mockClient.apiKey = '1234';
        }

    });    

    testIf(LIVE_TESTS_ENABLED, 'testing: delete() live tests', async () => {

        // valid resource to delete
        try {
            let testBRH = new BaseRequestHandler(liveClient);
            let r = await testBRH.delete(`/db/${TEST_DB_NAME}/Customer/FirstName/BaseRequestTestRecord`);                    
            expect(r.res.status).toBe(204)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent record - 404
        try {
            let testBRH = new BaseRequestHandler(liveClient);
            await testBRH.delete(`/db/${TEST_DB_NAME}/InvalidResource`);   
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // non-existent column in record - 400
        try {
            let testBRH = new BaseRequestHandler(liveClient);
            await testBRH.delete(`/db/${TEST_DB_NAME}/Customer/InvalidResource`);   
        }
        catch(e) {
            expect(e.message).toBe('400');
        }

        // no auth to update record - 403
        try {
            liveClient.apiKey = '';
            let testBRH = new BaseRequestHandler(liveClient);
            await testBRH.delete('/userdef/admin');               
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

    });            
});

