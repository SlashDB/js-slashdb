import fetchMock from 'fetch-mock-jest';
import { SlashDBClient } from '../src/slashdbclient.js';

afterEach( () => {
    fetchMock.mockReset();
});

describe('SlashDBClient() tests', () => {

    test('testing: constructor()', async () => {

        let invalid_apiKey_config = {
            apiKey: 12345
        };

        let invalid_sso_config = {
            sso: {
                idpId: 12345,
                redirectUri: 12345
            }
        };

        let host_config = {
            host: "https://demo.slashdb.com/"
        };

        // simplest constructor
        // ERROR cases

        // Invalid apiKey data type
        expect(() => {
            sdbClient = new SlashDBClient(invalid_apiKey_config);
        }).toThrowError();

        // Invalid sso idpId data type
        expect(() => {
            sdbClient = new SlashDBClient(invalid_sso_config);
        }).toThrowError();

        invalid_sso_config.sso.idpId = "okta";

        // Invalid sso redirectUri data type
        expect(() => {
            sdbClient = new SlashDBClient(invalid_sso_config);
        }).toThrowError();

        // login method
        // ERROR cases

        // Invalid username
        await expect(async () => {
            let sdbClient = new SlashDBClient(host_config);
            await sdbClient.login(12345, 12345);
        }).rejects.toThrowError(TypeError);

        // Invalid password
        await expect(async () => {
            let sdbClient = new SlashDBClient(host_config);
            await sdbClient.login("demo", 12345);
        }).rejects.toThrowError(TypeError);

    });

});