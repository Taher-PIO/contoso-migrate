import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../db/schema';

const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/contoso-university.sqlite';
const dbPath = DATABASE_URL.replace('file:', '');

const sqlite = new Database(dbPath);

// Enable WAL mode and foreign keys for SQLite
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('synchronous = NORMAL');

export const db = drizzle(sqlite, { schema });

export async function connectDatabase() {
    try {
        // Test connection with a simple query
        const result = sqlite.prepare('SELECT 1 as test').get();
        console.log('✅ Database connected successfully');
        console.log('✅ SQLite configured: WAL mode enabled, foreign keys ON');
        return db;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

export async function disconnectDatabase() {
    try {
        sqlite.close();
        console.log('✅ Database disconnected');
    } catch (error) {
        console.error('❌ Database disconnection failed:', error);
    }
}
