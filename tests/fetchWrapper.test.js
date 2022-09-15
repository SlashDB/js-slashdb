import fetchMock from 'fetch-mock-jest';
import { fetchWrapper } from '../modules/fetchwrapper.js';

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

describe('fetchWrapper() tests', () => {

    const liveTestsEnabled = true;
    const mockTestsEnabled = true;

    const liveSdbHost = 'http://192.168.1.9:8000'; 
    const mockHost = 'http://localhost:9999';

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

    testIf(mockTestsEnabled, 'GET mock tests', async () => {

        fetchMock
            .get(`${mockHost}/db/Chinook/Customer`, customers)
            .get(`${mockHost}/db/Chinook/InvalidResource`, 404 )
            .get(`${mockHost}/userdef/admin.json`, 403 )
            .get(`${mockHost}/userdef/admin`, 406 )

        // get a valid resource
        let r = await fetchWrapper('GET', `${mockHost}/db/Chinook/Customer`);
        expect(r.data).toStrictEqual(customers)
        expect(fetchMock).toHaveLastGot(`${mockHost}/db/Chinook/Customer`);

        // get a non-existent resource - 404
        try {
            await fetchWrapper('GET', `${mockHost}/db/Chinook/InvalidResource`);
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${mockHost}/db/Chinook/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // get a forbidden resource - 403
        try {
            await fetchWrapper('GET', `${mockHost}/userdef/admin.json`);
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${mockHost}/userdef/admin.json`);
            expect(e.message).toBe('403');
        }

        // get a resource in a non-existent format - 406
        try {
            await fetchWrapper('GET', `${mockHost}/userdef/admin`);
        }
        catch(e) {
            expect(fetchMock).toHaveLastGot(`${mockHost}/userdef/admin`);
            expect(e.message).toBe('406');
        }

    });


    testIf(liveTestsEnabled, 'GET live tests', async () => {

        try {
            let r = await fetchWrapper('GET', `${liveSdbHost}/db/Chinook/Customer.json?limit=3`);
            expect(r.data).toStrictEqual(customers)
        }
        catch(e) {
            throw Error(e)
        }

        try {
            await fetchWrapper('GET', `${liveSdbHost}/db/Chinook/InvalidResource`);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        try {
            await fetchWrapper('GET', `${liveSdbHost}/userdef/admin.json`);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

        // get a resource in a non-existent format - 406
        try {
            await fetchWrapper('GET', `${liveSdbHost}/userdef/admin`);
        }
        catch(e) {
            expect(e.message).toBe('406');
        }

    });


    testIf(mockTestsEnabled, 'POST mock tests', async () => {

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
            .post(`${mockHost}/db/Chinook/Customer`, (url, options) => {
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
            .post(`${mockHost}/db/Chinook/InvalidResource`, 404)

        // create a new record
        let r = await fetchWrapper('POST', `${mockHost}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        expect(r.status).toBe(201)
        expect(fetchMock).toHaveLastPosted(`${mockHost}/db/Chinook/Customer`);

        // create a record for a non-existent resource - 404
        try {
            await fetchWrapper('POST', `${mockHost}/db/Chinook/InvalidResource`, newCustomer, {'Content-Type': 'application/json', apiKey:null}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${mockHost}/db/Chinook/InvalidResource`);
            expect(e.message).toBe('404');
        }

        // create a new record w/o auth - 403
        try {
            await fetchWrapper('POST', `${mockHost}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:null}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${mockHost}/db/Chinook/Customer`);
            expect(e.message).toBe('403');
        }

        // create a new record with non-existent fields for given resource - 400
        try {
            newCustomer['nonExistentField'] = 'invalidValue';
            await fetchWrapper('POST', `${mockHost}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${mockHost}/db/Chinook/Customer`);
            expect(e.message).toBe('400');
            newCustomer['nonExistentField'] = undefined;
        }

        // create a record that already exists - 409
        try {
            newCustomer['CustomerId'] = 1
            await fetchWrapper('POST', `${mockHost}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPosted(`${mockHost}/db/Chinook/Customer`);
            expect(e.message).toBe('409');
            newCustomer['CustomerId'] = undefined;
        }
        
    });    

    testIf(liveTestsEnabled, 'POST live tests', async () => {

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
            let r = await fetchWrapper('POST', `${liveSdbHost}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
            expect(r.status).toBe(201)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent resource - 404
        try {
            await fetchWrapper('POST', `${liveSdbHost}/db/Chinook/InvalidResource`, newCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // no auth to create record - 403
        try {
             await fetchWrapper('POST', `${liveSdbHost}/userdef`, newCustomer, {'Content-Type': 'application/json'}, true);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

        // create a record that already exists - 409
        try {
            newCustomer['CustomerId'] = 1
            await fetchWrapper('POST', `${liveSdbHost}/db/Chinook/Customer`, newCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(e.message).toBe('409');
            newCustomer['CustomerId'] = undefined;
        }

    });    

    
    testIf(mockTestsEnabled, 'PUT mock tests', async () => {

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
            .put(`${mockHost}/db/Chinook/Customer/FirstName/POST`, (url, options) => {
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
            .put(`${mockHost}/db/Chinook/InvalidResource/FirstName/POST`, 404)

        // update a record
        let r = await fetchWrapper('PUT', `${mockHost}/db/Chinook/Customer/FirstName/POST`, updateCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        expect(r.status).toBe(201)
        expect(fetchMock).toHaveLastPut(`${mockHost}/db/Chinook/Customer/FirstName/POST`);

        // update a non-existent record - 404
        try {
            await fetchWrapper('PUT', `${mockHost}/db/Chinook/InvalidResource/FirstName/POST`, updateCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${mockHost}/db/Chinook/InvalidResource/FirstName/POST`);
            expect(e.message).toBe('404');
        }

        // // create a new record w/o auth - 403
        try {
            await fetchWrapper('PUT', `${mockHost}/db/Chinook/Customer/FirstName/POST`, updateCustomer, {'Content-Type': 'application/json', apiKey:null}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${mockHost}/db/Chinook/Customer/FirstName/POST`);
            expect(e.message).toBe('403');
        }

        // update a record with non-existent fields for given resource - 400
        try {
            updateCustomer['nonExistentField'] = 'invalidValue';
            await fetchWrapper('PUT', `${mockHost}/db/Chinook/Customer/FirstName/POST`, updateCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastPut(`${mockHost}/db/Chinook/Customer/FirstName/POST`);
            expect(e.message).toBe('400');
            updateCustomer['nonExistentField'] = undefined;
        }

    });    

    testIf(liveTestsEnabled, 'PUT live tests', async () => {

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
            let r = await fetchWrapper('PUT', `${liveSdbHost}/db/Chinook/Customer/FirstName/POST`, updateCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
            expect(r.status).toBe(204)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent record - 404
        try {
            await fetchWrapper('PUT', `${liveSdbHost}/db/Chinook/InvalidResource`, updateCustomer, {'Content-Type': 'application/json', apiKey:'1234'}, true);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // no auth to update record - 403
        try {
             await fetchWrapper('PUT', `${liveSdbHost}/userdef/admin`, updateCustomer, {'Content-Type': 'application/json'}, true);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

    });        

    testIf(mockTestsEnabled, 'DELETE mock tests', async () => {

        fetchMock
            .delete(`${mockHost}/db/Chinook/Customer/FirstName/PUT`, (url, options) => {
                if (!options.headers.apiKey) {
                        return 403;
                    }

            return 204;
            })
            .delete(`${mockHost}/db/Chinook/InvalidResource/FirstName/PUT`, 404)

        // delete a record
        let r = await fetchWrapper('DELETE', `${mockHost}/db/Chinook/Customer/FirstName/PUT`, undefined, {apiKey:'1234'}, true);
        expect(r.status).toBe(204)
        expect(fetchMock).toHaveLastDeleted(`${mockHost}/db/Chinook/Customer/FirstName/PUT`);

        // delete a non-existent record - 404
        try {
            await fetchWrapper('DELETE', `${mockHost}/db/Chinook/InvalidResource/FirstName/PUT`, undefined, {apiKey:'1234'}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastDeleted(`${mockHost}/db/Chinook/InvalidResource/FirstName/PUT`);
            expect(e.message).toBe('404');
        }

        // // delete a record w/o auth - 403
        try {
            await fetchWrapper('DELETE', `${mockHost}/db/Chinook/Customer/FirstName/PUT`, undefined, {apiKey:null}, true);
        }
        catch(e) {
            expect(fetchMock).toHaveLastDeleted(`${mockHost}/db/Chinook/Customer/FirstName/PUT`);
            expect(e.message).toBe('403');
        }
        
    });    

    testIf(liveTestsEnabled, 'DELETE live tests', async () => {

        // valid resource to delete
        try {
            let r = await fetchWrapper('DELETE', `${liveSdbHost}/db/Chinook/Customer/FirstName/PUT`, undefined, {apiKey:'1234'}, true);
            expect(r.status).toBe(204)
        }
        catch(e) {
            throw Error(e)
        }

        // non-existent record - 404
        try {
            await fetchWrapper('DELETE', `${liveSdbHost}/db/Chinook/InvalidResource`, undefined, {apiKey:'1234'}, true);
        }
        catch(e) {
            expect(e.message).toBe('404');
        }

        // no auth to update record - 403
        try {
             await fetchWrapper('DELETE', `${liveSdbHost}/userdef/admin`, undefined, undefined, true);
        }
        catch(e) {
            expect(e.message).toBe('403');
        }            

    });            
});


