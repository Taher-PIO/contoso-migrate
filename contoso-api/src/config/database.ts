import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Configuration matching ContosoUniversity/appsettings.json connection string
// Server=(localdb)\\mssqllocaldb;Database=SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f;Trusted_Connection=True;MultipleActiveResultSets=true
const config: sql.config = {
    server: process.env.DB_SERVER || '(localdb)\\mssqllocaldb',
    database: process.env.DB_DATABASE || 'SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f',

    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 30000,
    },

    // Trusted_Connection=True means Windows Authentication
    // (Omit authentication property for Windows Auth)

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

let pool: sql.ConnectionPool | null = null;

export const getConnection = async (): Promise<sql.ConnectionPool> => {
    if (!pool) {
        try {
            console.log('🔄 Connecting to SQL Server LocalDB...');
            console.log(`   Server: ${config.server}`);
            console.log(`   Database: ${config.database}`);
            console.log(`   Authentication: Windows (Trusted Connection)`);

            pool = await sql.connect(config);

            // Verify connection and get database info
            const result = await pool.request().query(`
                SELECT 
                    DB_NAME() AS CurrentDatabase,
                    SERVERPROPERTY('Edition') AS Edition
            `);

            console.log('✅ Connected to SQL Server successfully!');
            console.log(`   Current Database: ${result.recordset[0].CurrentDatabase}`);
            console.log(`   Edition: ${result.recordset[0].Edition}`);

        } catch (error) {
            console.error('❌ Database connection failed!');
            console.error('');
            console.error('🔧 Troubleshooting Steps:');
            console.error('   1. Start LocalDB: sqllocaldb start mssqllocaldb');
            console.error('   2. Check status: sqllocaldb info mssqllocaldb');
            console.error('   3. Verify .NET app connects successfully');
            console.error('   4. Ensure database exists (run .NET app migrations)');
            console.error('');

            if (error instanceof Error) {
                console.error('Error Message:', error.message);
                console.error('Error Name:', error.name);
            }
            console.error('Full Error:', error);
            throw error;
        }
    }
    return pool;
};

export const closeConnection = async (): Promise<void> => {
    if (pool) {
        await pool.close();
        pool = null;
        console.log('❌ SQL Server connection closed');
    }
};

export { sql };
