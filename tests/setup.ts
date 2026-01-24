// Jest setup file

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock environment variables for tests
process.env.DISCORD_TOKEN = 'test_token';
process.env.DISCORD_CLIENT_ID = 'test_client_id';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global test setup
beforeAll(() => {
  // Setup code that runs before all tests
});

// Global test teardown
afterAll(() => {
  // Cleanup code that runs after all tests
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
