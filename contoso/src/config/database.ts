import Database from 'better-sqlite3';
import path from 'path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';

const dbPath = path.join(__dirname, '../../data/contoso-university.sqlite');

let sqliteDb: Database.Database | null = null;

export const getSqliteConnection = (): Database.Database => {
    if (!sqliteDb) {
        console.log('🔄 Connecting to SQLite database...');
        console.log(`   Database path: ${dbPath}`);

        sqliteDb = new Database(dbPath);
        
        // Enable foreign keys and WAL mode
        sqliteDb.pragma('foreign_keys = ON');
        sqliteDb.pragma('journal_mode = WAL');
        sqliteDb.pragma('synchronous = NORMAL');
        
        console.log('✅ Connected to SQLite database successfully!');
        console.log('✅ SQLite configured: WAL mode enabled, foreign keys ON');
    }
    return sqliteDb;
};

export const db = drizzle(getSqliteConnection(), { schema });

export const closeSqliteConnection = (): void => {
    if (sqliteDb) {
        sqliteDb.close();
        sqliteDb = null;
        console.log('❌ SQLite connection closed');
    }
};

export async function connectDatabase() {
    try {
        getSqliteConnection();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}

export async function disconnectDatabase() {
    closeSqliteConnection();
    console.log('✅ Database disconnected');
}

// Graceful shutdown
process.on('beforeExit', () => {
    closeSqliteConnection();
});
