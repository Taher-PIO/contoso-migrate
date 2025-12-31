// Test setup file
import { disconnectDatabase } from '../src/config/drizzle';

// Global teardown
afterAll(async () => {
    await disconnectDatabase();
});
