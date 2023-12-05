module.exports = {
  globals: {
    LIVE_TESTS_ENABLED: true,
	MOCK_TESTS_ENABLED: true,
	LIVE_SDB_HOST: 'http://127.0.0.1:8000',
	LIVE_SDB_API_KEY: 'zqqzcves4g3n0yk11yfcxnbhxyic50w3',
	SDB_TEST_DB_NAME: 'Chinook',
	MOCK_HOST: 'http://localhost'
  },
  "setupFilesAfterEnv": ["<rootDir>/tests/setupTests.js", "mock-local-storage"]
};