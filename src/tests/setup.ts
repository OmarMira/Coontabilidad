import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../mocks/server';
import '@testing-library/jest-dom';

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());
