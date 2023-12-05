import fetchMock from 'fetch-mock-jest';
import { SlashDBClient } from '../src/slashdbclient.js';

afterEach( () => {
    fetchMock.mockReset();
});

describe('SlashDBClient() tests', () => {

    test('testing: constructor()',() => {

        let invalidApiKeyConfig = {
            apiKey: 12345
        };

        let invalidSsoConfig = {
            sso: {
                idpId: 12345,
                redirectUri: 12345,
                popUp: 12345
            }
        };

        // simplest constructor
        // ERROR cases

        // Invalid apiKey data type
        expect(() => {
            sdbClient = new SlashDBClient(invalidApiKeyConfig);
        }).toThrowError();

        // Invalid sso idpId data type
        expect(() => {
            sdbClient = new SlashDBClient(invalidSsoConfig);
        }).toThrowError();

        invalidSsoConfig.sso.idpId = "okta";

        // Invalid sso redirectUri data type
        expect(() => {
            sdbClient = new SlashDBClient(invalidSsoConfig);
        }).toThrowError();

        invalidSsoConfig.sso.redirectUri = "http://localhost:3001/redirect";

        // Invalid sso redirectUri data type
        expect(() => {
            sdbClient = new SlashDBClient(invalidSsoConfig);
        }).toThrowError();

    });
    
    test('testing: login()', async () => {

        let sdbSettings = {
            auth_settings: {
                authentication_policies: {
                    jwt: {
                        identity_providers: {
                            keycloak: {
                                client_id: "keycloak"
                            }
                        }
                    }
                }
            }
        }

        fetchMock
            .get(`${MOCK_HOST}/settings.json`, sdbSettings)

        let hostConfig = {
            host: `${MOCK_HOST}`
        };

        let ssoConfig = {
            host: `${MOCK_HOST}`,
            sso: {
                idpId: "okta",
                redirectUri: "http://localhost:3001/redirect",
                popUp: true
            }
        }

        // login method
        // ERROR cases

        // Invalid username
        await expect(async () => {
            let sdbClient = new SlashDBClient(hostConfig);
            await sdbClient.login(12345, 12345);
        }).rejects.toThrowError(TypeError);

        // Invalid password
        await expect(async () => {
            let sdbClient = new SlashDBClient(hostConfig);
            await sdbClient.login("demo", 12345);
        }).rejects.toThrowError(TypeError);

        // Invalid idp id
        await expect(async () => {
            let sdbClient = new SlashDBClient(ssoConfig);
            await sdbClient.login();
        }).rejects.toThrowError("Identity provider not available in settings");

    });

});