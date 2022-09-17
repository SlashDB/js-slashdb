import fetchMock from 'fetch-mock-jest';
import { DataDiscoveryResource, DataDiscoveryDatabase } from '../modules/datadiscovery.js';
import { SlashDBClient } from '../modules/slashdbclient.js';

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

describe('DataDiscoveryResource() class tests', () => {

    const mockClient = new SlashDBClient(MOCK_HOST,'admin','1234');
    const liveClient = new SlashDBClient(LIVE_SDB_HOST,'admin', LIVE_SDB_API_KEY);
    
    const customers = 
    [
        {
            "__href": "/db/Chinook/Customer/CustomerId/1.json",
            "Employee": {
                "__href": "/db/Chinook/Customer/CustomerId/1/Employee.json"
            },
            "CustomerId": 1,
            "FirstName": "Lu\u00eds",
            "LastName": "Gon\u00e7alves",
            "Company": "Embraer - Empresa Brasileira de Aeron\u00e1utica S.A.",
            "Address": "Av. Brigadeiro Faria Lima, 2170",
            "City": "S\u00e3o Jos\u00e9 dos Campos",
            "State": "SP",
            "Country": "Brazil",
            "PostalCode": "12227-000",
            "Phone": "+55 (12) 3923-5555",
            "Fax": "+55 (12) 3923-5566",
            "Email": "luisg@embraer.com.br",
            "SupportRepId": 3,
            "Invoice": {
                "__href": "/db/Chinook/Customer/CustomerId/1/Invoice.json"
            }
        },
        {
            "__href": "/db/Chinook/Customer/CustomerId/2.json",
            "Employee": {
                "__href": "/db/Chinook/Customer/CustomerId/2/Employee.json"
            },
            "CustomerId": 2,
            "FirstName": "Leonie",
            "LastName": "K\u00f6hler",
            "Company": null,
            "Address": "Theodor-Heuss-Stra\u00dfe 34",
            "City": "Stuttgart",
            "State": null,
            "Country": "Germany",
            "PostalCode": "70174",
            "Phone": "+49 0711 2842222",
            "Fax": null,
            "Email": "leonekohler@surfeu.de",
            "SupportRepId": 5,
            "Invoice": {
                "__href": "/db/Chinook/Customer/CustomerId/2/Invoice.json"
            }
        },
        {
            "__href": "/db/Chinook/Customer/CustomerId/3.json",
            "Employee": {
                "__href": "/db/Chinook/Customer/CustomerId/3/Employee.json"
            },
            "CustomerId": 3,
            "FirstName": "Fran\u00e7ois",
            "LastName": "Tremblay",
            "Company": null,
            "Address": "1498 rue B\u00e9langer",
            "City": "Montr\u00e9al",
            "State": "QC",
            "Country": "Canada",
            "PostalCode": "H2G 1A7",
            "Phone": "+1 (514) 721-4711",
            "Fax": null,
            "Email": "ftremblay@gmail.com",
            "SupportRepId": 3,
            "Invoice": {
                "__href": "/db/Chinook/Customer/CustomerId/3/Invoice.json"
            }
        }
    ];

    test('testing: constructor()', () => {

        const testDDD = new DataDiscoveryDatabase(mockClient, 'Chinook')

        // simplest constructor - dbName and resourceName defined as strings, client object explicitly given
        let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)
        expect(testDDR).toHaveProperty('dbPrefix');
        expect(testDDR.dbPrefix).toBe('/db/');
        expect(testDDR).toHaveProperty('dbName');
        expect(testDDR.dbName).toBe('Chinook');
        expect(testDDR).toHaveProperty('resourceName');
        expect(testDDR.resourceName).toBe('Customer');
        expect(testDDR).toHaveProperty('sdbClient');
        expect(testDDR.sdbClient).toBeInstanceOf(SlashDBClient)

        // dbName and client provided in a DataDiscoveryDatabase object
        testDDR = new DataDiscoveryResource(testDDD, 'Customer')
        expect(testDDR).toHaveProperty('dbPrefix');
        expect(testDDR.dbPrefix).toBe('/db/');
        expect(testDDR).toHaveProperty('dbName');
        expect(testDDR.dbName).toBe('Chinook');
        expect(testDDR).toHaveProperty('resourceName');
        expect(testDDR.resourceName).toBe('Customer');
        expect(testDDR).toHaveProperty('sdbClient');
        expect(testDDR.sdbClient).toBeInstanceOf(SlashDBClient)        

        // ERROR cases
        expect(() => {
            result = new DataDiscoveryResource();
        }).toThrowError();

        // no database name or object given
        expect(() => {
            result = new DataDiscoveryResource(undefined,'Customer',mockClient);
        }).toThrowError();

        // no resource name or object given
        expect(() => {
            result = new DataDiscoveryResource('Chinook',undefined,mockClient);
        }).toThrowError();

        // no client object provided
        expect(() => {
            result = new DataDiscoveryResource('Chinook','Customer');
        }).toThrowError();        

        // non-strings for dbName, resourceName
        expect(() => {
            result = new DataDiscoveryResource(123,'Customer',mockClient);
        }).toThrowError();          
        expect(() => {
            result = new DataDiscoveryResource('123','123',mockClient);
        }).toThrowError();    

        // non-SlashDBClient object for client object
        expect(() => {
            result = new DataDiscoveryResource('Chinook','Customer',{a:'1'});
        }).toThrowError();          

        // non-DataDiscoveryDatabase object provided
        expect(() => {
            result = new DataDiscoveryResource({a:'1'}, 'Customer');
        }).toThrowError();  

        // DDD with invalid sdbClient provided
        const badDDD = new DataDiscoveryDatabase(mockClient,'Chinook');
        badDDD.sdbClient = 'invalid';
        expect(() => {
            result = new DataDiscoveryResource(badDDD, 'Customer');
        }).toThrowError();  


    });

    test('testing: accept() method', () => {
        let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)
        expect(testDDR).toHaveProperty('acceptHeader')
        expect(testDDR.acceptHeader).toBe('application/json')
        testDDR.accept('csv')
        expect(testDDR.acceptHeader).toBe('text/csv')

        // ERROR cases
        expect(() => {
            testDDR.accept()
        }).toThrowError();  

        // non-string parameter
        expect(() => {
            testDDR.accept(1)
        }).toThrowError();  

    });

    test('testing: contentType() method', () => {
        let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)
        expect(testDDR).toHaveProperty('contentTypeHeader')
        expect(testDDR.contentTypeHeader).toBe('application/json')        
        testDDR.contentType('csv')
        expect(testDDR.contentTypeHeader).toBe('text/csv')

        // ERROR cases
        expect(() => {
            testDDR.contentType()
        }).toThrowError();  

        // non-string parameter
        expect(() => {
            testDDR.contentType(1)
        }).toThrowError();  
        
    });

    test('testing: extraHeaders() method', () => {

        const testHeader = {
            'key1':'value1',
            'key2':'value2',
            'key3':'value3',
        }

        let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)
        expect(testDDR).toHaveProperty('extraHeaders')
        expect(testDDR.extraHeaders).toEqual({})

        // can set initial keys
        testDDR.setExtraHeaders(testHeader)
        expect(testDDR.extraHeaders).toEqual(testHeader)
        
        // can add keys
        testHeader['key4'] = 'value4'
        testDDR.setExtraHeaders({'key4':'value4'})
        expect(testDDR.extraHeaders).toEqual(testHeader)

        // values can be numbers
        testHeader['key5'] = 5
        testDDR.setExtraHeaders({'key5':5})
        expect(testDDR.extraHeaders).toEqual(testHeader)


        // ERROR cases
        // empty param
        expect(() => {
            testDDR.setExtraHeaders()
        }).toThrowError();  
        
        // non-string/number values
        expect(() => {
            const badObj = {'arrayKey':[]}
            testDDR.setExtraHeaders(badObj)
        }).toThrowError();  

        
    });

    testIf(MOCK_TESTS_ENABLED, 'testing: get() mock tests', async () => {

        fetchMock
            .get(`${MOCK_HOST}/db/Chinook/Customer`, customers)
            .get(`${MOCK_HOST}/db/Chinook/Customer/InvalidResource`, 404 )
            .get(`${MOCK_HOST}/db/Chinook/Customer/ForbiddenResource`, (url, options) => {
                if (!options.headers.apiKey) {
                    return 403;
                }
                return 200;
            })
            .get(`${MOCK_HOST}/userdef/admin`, 406 )

        let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)
        let r = await testDDR.get();
        expect(r.data).toStrictEqual(customers)
        expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/db/Chinook/Customer`);

        // get a non-existent resource - 404
        try {
            let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)
            await  testDDR.get('InvalidResource');
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/db/Chinook/Customer/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // get a forbidden resource - 403
        try {
            let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)            
            await testDDR.get('ForbiddenResource');
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/db/Chinook/Customer/ForbiddenResource`);
            expect(e.message).toBe('403');
        }

        // // get a resource in a non-existent format - 406
        // try {
        //     let testDDR = new DataDiscoveryResource('/userdef/admin','deleteme',mockClient) 
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
            let testDDR = new DataDiscoveryResource('Chinook','Customer',liveClient)
            let r = await testDDR.get('?limit=3');            
            expect(r.data).toStrictEqual(customers)
        }
        catch(e) {
            throw Error(e)
        }

        // 404 error - non-existent resource
        try {
            let testDDR = new DataDiscoveryResource('Chinook','InvalidResource',liveClient)            
            await testDDR.get();
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // 400 error - non-existent column in resource
        try {
            let testDDR = new DataDiscoveryResource('Chinook','Customer',liveClient)            
            await testDDR.get('InvalidResource');
        }
        catch(e) {
            expect(e.message).toBe('400');
        }

        // get a resource in a non-existent format - 406
        try {
            let testDDR = new DataDiscoveryResource('/userdef/admin','deleteme',liveClient) 
            testDDR.dbPrefix = '';
            testDDR.resourceName = '';        
            await testDDR.get()
        }
        catch(e) {
            expect(e.message).toBe('406');
        }

    try {
        liveClient.apiKey = '';
        let testDDR = new DataDiscoveryResource('/userdef','deleteme',liveClient) 
        testDDR.dbPrefix = '';
        testDDR.resourceName = '';        
        await testDDR.get()
    }
    catch(e) {
        expect(e.message).toBe('403');
    }    

    });


    testIf(MOCK_TESTS_ENABLED, 'testing: post() mock tests', async () => {

        let newCustomer = {
            "FirstName": "POST",
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
            .post(`${MOCK_HOST}/db/Chinook/Customer`, (url, options) => {
                let b = JSON.parse(options.body)
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
            .post(`${MOCK_HOST}/db/Chinook/Customer/InvalidResource`, 404)

        // create a new record
        let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)        
        let r = await testDDR.post(newCustomer);
        expect(r.res.status).toBe(201)
        expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/Customer`);

        // create a record for a non-existent resource - 404
        try {
            await testDDR.post(newCustomer,'InvalidResource');
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/Customer/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // create a new record w/o auth - 403
        try {
            mockClient.sdbConfig.apKey = null;            
            await testDDR.post(newCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/Customer`);
            expect(e.message).toBe('403');
            mockClient.sdbConfig.apKey = '1234';             
        }

        // create a new record with non-existent fields for given resource - 400
        try {
            newCustomer['nonExistentField'] = 'invalidValue';
            await testDDR.post(newCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/Customer`);
            expect(e.message).toBe('400');
            newCustomer['nonExistentField'] = undefined;
        }

        // create a record that already exists - 409
        try {
            newCustomer['CustomerId'] = 1
            await testDDR.post(newCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/Customer`);
            expect(e.message).toBe('409');
            newCustomer['CustomerId'] = undefined;
        }
        
    });    

    testIf(LIVE_TESTS_ENABLED, 'testing: post() live tests', async () => {

        let newCustomer = {
            "FirstName": "POST",
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
            let testDDR = new DataDiscoveryResource('Chinook','Customer',liveClient) 
            let r = await testDDR.post(newCustomer);
            expect(r.res.status).toBe(201)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent resource - 404
        try {
            let testDDR = new DataDiscoveryResource('Chinook','Customer',liveClient) 
            let r = await testDDR.post(newCustomer);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // create a record that already exists - 409
        try {
            newCustomer['CustomerId'] = 1
            let testDDR = new DataDiscoveryResource('Chinook','Customer',liveClient) 
            let r = await testDDR.post(newCustomer);
        }
        catch(e) {
            expect(e.message).toBe('409');
            newCustomer['CustomerId'] = undefined;
        }

        // no auth to create record - 403
        try {
            liveClient.apiKey = '';
            let testDDR = new DataDiscoveryResource('/userdef','deleteme',liveClient) 
            testDDR.dbPrefix = '';
            testDDR.resourceName = '';
            let r = await testDDR.post(newCustomer);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }               
    });    

    
    testIf(MOCK_TESTS_ENABLED, 'testing: put() mock tests', async () => {

        let updateCustomer = {
            "FirstName": "PUT",
            "LastName": "Test",
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
            .put(`${MOCK_HOST}/db/Chinook/Customer/FirstName/POST`, (url, options) => {
                let b = JSON.parse(options.body)
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
            .put(`${MOCK_HOST}/db/Chinook/Customer/InvalidResource/FirstName/POST`, 404)

        // update a record
        let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)    
        let r = await testDDR.put('FirstName/POST', updateCustomer);
        expect(r.res.status).toBe(201)
        expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/Chinook/Customer/FirstName/POST`);

        // update a non-existent record - 404
        try {
            await testDDR.put('InvalidResource/FirstName/POST', updateCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/Chinook/Customer/InvalidResource/FirstName/POST`);
            expect(e.message).toBe('404');
        }

        // create a new record w/o auth - 403
        try {
            mockClient.sdbConfig.apKey = null;   
            await testDDR.put('FirstName/POST', updateCustomer);
            
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/Chinook/Customer/FirstName/POST`);
            expect(e.message).toBe('403');
            mockClient.sdbConfig.apiKey = '1234';
        }

        // update a record with non-existent fields for given resource - 400
        try {
            updateCustomer['nonExistentField'] = 'invalidValue';
            await testDDR.put('FirstName/POST', updateCustomer);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/Chinook/Customer/FirstName/POST`);
            expect(e.message).toBe('400');
            updateCustomer['nonExistentField'] = undefined;
        }

        
    });    

    testIf(LIVE_TESTS_ENABLED, 'testing: put() live tests', async () => {

        let updateCustomer = {
            "FirstName": "PUT",
            "LastName": "Test",
            "Company": "PUTCompany",
            "Address": "456 Ave",
            "City": "Boston",
            "State": "MA",
            "Country": "USA",
            "PostalCode": "12345",
            "Phone": "+1 (555) 555-5555",
            "Email": "user@putcompany.com",
        }

        // valid resource to update
        try {
            let testDDR = new DataDiscoveryResource('Chinook','Customer',liveClient)    
            let r = await testDDR.put('FirstName/POST', updateCustomer);            
            expect(r.res.status).toBe(204)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent record - 404
        try {
            let testDDR = new DataDiscoveryResource('Chinook','InvalidResource',liveClient)    
            let r = await testDDR.put('FirstName/POST', updateCustomer);  
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // non-existent column in record - 400
        try {
            let testDDR = new DataDiscoveryResource('Chinook','Customer',liveClient)    
            let r = await testDDR.put('InvalidResource/POST', updateCustomer);  
        }
        catch(e) {
            expect(e.message).toBe('400');
        }

        // no auth to update record - 403
        try {
            liveClient.apiKey = '';
            let testDDR = new DataDiscoveryResource('/userdef','deleteme',liveClient) 
            testDDR.dbPrefix = '';
            testDDR.resourceName = '';
            let r = await testDDR.put('admin',updateCustomer);  
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

    });        

    testIf(MOCK_TESTS_ENABLED, 'testing: delete() mock tests', async () => {

        fetchMock
            .delete(`${MOCK_HOST}/db/Chinook/Customer/FirstName/PUT`, (url, options) => {
                if (!options.headers.apiKey) {
                        return 403;
                    }

            return 204;
            })
            .delete(`${MOCK_HOST}/db/Chinook/InvalidResource/FirstName/PUT`, 404)
            .delete(`${MOCK_HOST}/db/Chinook/Customer/InvalidResource/FirstName/PUT`, 400)

        // delete a record
        let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)    
        let r = await testDDR.delete('FirstName/PUT');
        expect(r.res.status).toBe(204)
        expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/Chinook/Customer/FirstName/PUT`);

        // delete a non-existent record - 404
        try {
            let testDDR = new DataDiscoveryResource('Chinook','InvalidResource',mockClient)    
            let r = await testDDR.delete('FirstName/PUT');
        }
        catch(e) {
            expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/Chinook/InvalidResource/FirstName/PUT`);
            expect(e.message).toBe('404');
        }

        // non-existent column in record - 400
        try {
            let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient)    
            let r = await testDDR.delete('InvalidResource/FirstName/PUT');
        }
        catch(e) {
            //expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/Chinook/Customer/InvalidResource/FirstName/PUT`);
            expect(e.message).toBe('400');
        }

        // delete a record w/o auth - 403
        try {
            mockClient.apiKey = '';
            let testDDR = new DataDiscoveryResource('Chinook','Customer',mockClient) 
            await testDDR.delete('FirstName/PUT');
        }
        catch(e) {
            expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/Chinook/Customer/FirstName/PUT`);
            expect(e.message).toBe('403');
            mockClient.apiKey = '1234';
        }

    });    

    testIf(LIVE_TESTS_ENABLED, 'testing: delete() live tests', async () => {

        // valid resource to delete
        try {
            let testDDR = new DataDiscoveryResource('Chinook','Customer',liveClient)    
            let r = await testDDR.delete('FirstName/PUT');                    
            expect(r.res.status).toBe(204)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent record - 404
        try {
            let testDDR = new DataDiscoveryResource('Chinook','InvalidResource',liveClient)    
            await testDDR.delete();   
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // non-existent column in record - 400
        try {
            let testDDR = new DataDiscoveryResource('Chinook','Customer',liveClient)    
            await testDDR.delete('InvalidResource');   
        }
        catch(e) {
            expect(e.message).toBe('400');
        }

        // no auth to update record - 403
        try {
            liveClient.apiKey = '';
            let testDDR = new DataDiscoveryResource('/userdef','deleteme',liveClient) 
            testDDR.dbPrefix = '';
            testDDR.resourceName = '';
            await testDDR.delete('admin');               
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

    });            
});

