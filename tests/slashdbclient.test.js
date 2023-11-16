import fetchMock from 'fetch-mock-jest';
import { SlashDBClient } from '../src/slashdbclient.js';

const testIf = (condition, ...args) =>
  condition ? test(...args) : test.skip(...args);

  beforeAll( async () => {
    // disable console errors, warns    
});

afterEach( () => {
});


afterAll( async () => {
    
});