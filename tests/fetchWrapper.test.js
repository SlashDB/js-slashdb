import fetchMock from 'fetch-mock-jest';
import { fetchWrapper } from '../src/fetchwrapper.js';

const testIf = (condition, ...args) =>
  condition ? test(...args) : test.skip(...args);

  beforeAll( () => {
    // disable console errors, warns
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    let testCustomer = {
        "FirstName": "fetchWrapperTestRecord",
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
    fetchWrapper("POST", `${LIVE_SDB_HOST}/db/Chinook/Customer`, testCustomer, {'Content-Type': 'application/json'});
    
});

afterEach( () => {
    fetchMock.mockReset();
});


afterAll( async () => {
    // delete the record created by the POST test
    try {
        let r = await fetchWrapper("DELETE", `${LIVE_SDB_HOST}/db/Chinook/Customer/FirstName/POSTTest`);
    }
    catch(e) {
        null;
    }
    // delete the record created before tests ran if DELETE test failed to delete it
    try {
        let r = await fetchWrapper("DELETE", `${LIVE_SDB_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`);
    }
    catch(e) {
        null;
    }
});

describe('fetchWrapper() tests', () => {

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

    testIf(MOCK_TESTS_ENABLED, 'GET mock tests', async () => {

        fetchMock
            .get(`${MOCK_HOST}/db/Chinook/Customer`, customers)
            .get(`${MOCK_HOST}/db/Chinook/InvalidResource`, 404 )
            .get(`${MOCK_HOST}/userdef/admin.json`, 403 )
            .get(`${MOCK_HOST}/userdef/admin`, 406 )

        // get a valid resource
        let r = await fetchWrapper('GET', `${MOCK_HOST}/db/Chinook/Customer`);
        expect(r.data).toStrictEqual(customers)
        expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/db/Chinook/Customer`);

        // get a non-existent resource - 404
        try {
            await fetchWrapper('GET', `${MOCK_HOST}/db/Chinook/InvalidResource`);
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/db/Chinook/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // get a forbidden resource - 403
        try {
            await fetchWrapper('GET', `${MOCK_HOST}/userdef/admin.json`);
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/userdef/admin.json`);
            expect(e.message).toBe('403');
        }

        // get a resource in a non-existent format - 406
        try {
            await fetchWrapper('GET', `${MOCK_HOST}/userdef/admin`);
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${MOCK_HOST}/userdef/admin`);
            expect(e.message).toBe('406');
        }

    });


    testIf(LIVE_TESTS_ENABLED, 'GET live tests', async () => {

        try {
            let r = await fetchWrapper('GET', `${LIVE_SDB_HOST}/db/Chinook/Customer.json?limit=3`);
            expect(r.data).toStrictEqual(customers)
        }
        catch(e) {
            throw Error(e)
        }

        try {
            await fetchWrapper('GET', `${LIVE_SDB_HOST}/db/Chinook/InvalidResource`);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        try {
            await fetchWrapper('GET', `${LIVE_SDB_HOST}/userdef/admin.json`);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

        // get a resource in a non-existent format - 406
        try {
            await fetchWrapper('GET', `${LIVE_SDB_HOST}/userdef/admin`);
        }
        catch(e) {
            expect(e.message).toBe('406');
        }

    });


    testIf(MOCK_TESTS_ENABLED, 'POST mock tests', async () => {

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
            .post(`${MOCK_HOST}/db/Chinook/InvalidResource`, 404)

        // create a new record
        let r = await fetchWrapper('POST', `${MOCK_HOST}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        expect(r.status).toBe(201)
        expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/Customer`);

        // create a record for a non-existent resource - 404
        try {
            await fetchWrapper('POST', `${MOCK_HOST}/db/Chinook/InvalidResource`, newCustomer, {'Content-Type': 'application/json', apiKey:null}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // create a new record w/o auth - 403
        try {
            await fetchWrapper('POST', `${MOCK_HOST}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:null}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/Customer`);
            expect(e.message).toBe('403');
        }

        // create a new record with non-existent fields for given resource - 400
        try {
            newCustomer['nonExistentField'] = 'invalidValue';
            await fetchWrapper('POST', `${MOCK_HOST}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/Customer`);
            expect(e.message).toBe('400');
            newCustomer['nonExistentField'] = undefined;
        }

        // create a record that already exists - 409
        try {
            newCustomer['CustomerId'] = 1
            await fetchWrapper('POST', `${MOCK_HOST}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${MOCK_HOST}/db/Chinook/Customer`);
            expect(e.message).toBe('409');
            newCustomer['CustomerId'] = undefined;
        }
        
    });    

    testIf(LIVE_TESTS_ENABLED, 'POST live tests', async () => {

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
            let r = await fetchWrapper('POST', `${LIVE_SDB_HOST}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:LIVE_SDB_API_KEY}, true);
            expect(r.status).toBe(201)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent resource - 404
        try {
            await fetchWrapper('POST', `${LIVE_SDB_HOST}/db/Chinook/InvalidResource`, newCustomer, {'Content-Type': 'application/json', apiKey:LIVE_SDB_API_KEY}, true);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // no auth to create record - 403
        try {
             await fetchWrapper('POST', `${LIVE_SDB_HOST}/userdef`, newCustomer, {'Content-Type': 'application/json'}, true);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

        // create a record that already exists - 409
        try {
            newCustomer['CustomerId'] = 1
            await fetchWrapper('POST', `${LIVE_SDB_HOST}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:LIVE_SDB_API_KEY}, true);
        }
        catch(e) {
            expect(e.message).toBe('409');
            newCustomer['CustomerId'] = undefined;
        }

    });    

    
    testIf(MOCK_TESTS_ENABLED, 'PUT mock tests', async () => {

        let updateCustomer = {
            "FirstName": "fetchWrapperTestRecord",
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
            .put(`${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`, (url, options) => {
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
            .put(`${MOCK_HOST}/db/Chinook/InvalidResource/FirstName/fetchWrapperTestRecord`, 404)

        // update a record
        let r = await fetchWrapper('PUT', `${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`, updateCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        expect(r.status).toBe(201)
        expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`);

        // update a non-existent record - 404
        try {
            await fetchWrapper('PUT', `${MOCK_HOST}/db/Chinook/InvalidResource/FirstName/fetchWrapperTestRecord`, updateCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/Chinook/InvalidResource/FirstName/fetchWrapperTestRecord`);
            expect(e.message).toBe('404');
        }

        // // create a new record w/o auth - 403
        try {
            await fetchWrapper('PUT', `${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`, updateCustomer, {'Content-Type': 'application/json', apiKey:null}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`);
            expect(e.message).toBe('403');
        }

        // update a record with non-existent fields for given resource - 400
        try {
            updateCustomer['nonExistentField'] = 'invalidValue';
            await fetchWrapper('PUT', `${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`, updateCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`);
            expect(e.message).toBe('400');
            updateCustomer['nonExistentField'] = undefined;
        }

    });    

    testIf(LIVE_TESTS_ENABLED, 'PUT live tests', async () => {

        let updateCustomer = {
            "LastName": "ChangedRecord",
        }

        // valid resource to update
        try {
            let r = await fetchWrapper('PUT', `${LIVE_SDB_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`, updateCustomer, {'Content-Type': 'application/json', apiKey:LIVE_SDB_API_KEY}, true);
            expect(r.status).toBe(204)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent record - 404
        try {
            await fetchWrapper('PUT', `${LIVE_SDB_HOST}/db/Chinook/InvalidResource`, updateCustomer, {'Content-Type': 'application/json', apiKey:LIVE_SDB_API_KEY}, true);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // no auth to update record - 403
        try {
             await fetchWrapper('PUT', `${LIVE_SDB_HOST}/userdef/admin`, updateCustomer, {'Content-Type': 'application/json'}, true);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

    });        

    testIf(MOCK_TESTS_ENABLED, 'DELETE mock tests', async () => {

        fetchMock
            .delete(`${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`, (url, options) => {
                if (!options.headers.apiKey) {
                        return 403;
                    }

            return 204;
            })
            .delete(`${MOCK_HOST}/db/Chinook/InvalidResource/FirstName/fetchWrapperTestRecord`, 404)

        // delete a record
        let r = await fetchWrapper('DELETE', `${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`, undefined, {apiKey:'1234'}, true);
        expect(r.status).toBe(204)
        expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`);

        // delete a non-existent record - 404
        try {
            await fetchWrapper('DELETE', `${MOCK_HOST}/db/Chinook/InvalidResource/FirstName/fetchWrapperTestRecord`, undefined, {apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/Chinook/InvalidResource/FirstName/fetchWrapperTestRecord`);
            expect(e.message).toBe('404');
        }

        // // delete a record w/o auth - 403
        try {
            await fetchWrapper('DELETE', `${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`, undefined, {apiKey:null}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastDeleted(`${MOCK_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`);
            expect(e.message).toBe('403');
        }
        
    });    

    testIf(LIVE_TESTS_ENABLED, 'DELETE live tests', async () => {

        // valid resource to delete
        try {
            let r = await fetchWrapper('DELETE', `${LIVE_SDB_HOST}/db/Chinook/Customer/FirstName/fetchWrapperTestRecord`, undefined, {apiKey:LIVE_SDB_API_KEY}, true);
            expect(r.status).toBe(204)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent record - 404
        try {
            await fetchWrapper('DELETE', `${LIVE_SDB_HOST}/db/Chinook/InvalidResource`, undefined, {apiKey:LIVE_SDB_API_KEY}, true);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // no auth to update record - 403
        try {
             await fetchWrapper('DELETE', `${LIVE_SDB_HOST}/userdef/admin`, undefined, undefined, true);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

    });            
});


