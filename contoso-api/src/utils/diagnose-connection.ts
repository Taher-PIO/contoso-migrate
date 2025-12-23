import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

async function diagnoseConnection() {
    console.log('='.repeat(70));
    console.log('SQL SERVER CONNECTION DIAGNOSTIC TOOL');
    console.log('='.repeat(70));
    console.log('');

    console.log('📋 Configuration from .env:');
    console.log(`   DB_SERVER: ${process.env.DB_SERVER || 'NOT SET'}`);
    console.log(`   DB_DATABASE: ${process.env.DB_DATABASE || 'NOT SET'}`);
    console.log(`   DB_ENCRYPT: ${process.env.DB_ENCRYPT || 'NOT SET'}`);
    console.log('');

    const config: sql.config = {
        server: process.env.DB_SERVER || '(localdb)\\mssqllocaldb',
        database: process.env.DB_DATABASE || 'SchoolContext-a8778b0f-1bfd-4d0f-a500-09390a0df97f',
        options: {
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: true,
            enableArithAbort: true,
            connectTimeout: 30000,
            requestTimeout: 30000,
        },
        // authentication: {
        //     type: 'ntlm',
        // },
    };

    try {
        console.log('🔄 Attempting connection...');
        console.log('');

        const pool = await sql.connect(config);

        console.log('✅ CONNECTION SUCCESSFUL!');
        console.log('');

        // Get database information
        const result = await pool.request().query(`
            SELECT 
                DB_NAME() AS DatabaseName,
                SERVERPROPERTY('Edition') AS Edition,
                SERVERPROPERTY('ProductVersion') AS Version,
                @@VERSION AS FullVersion
        `);

        const info = result.recordset[0];
        console.log('📊 Database Information:');
        console.log(`   Database Name: ${info.DatabaseName}`);
        console.log(`   Edition: ${info.Edition}`);
        console.log(`   Version: ${info.Version}`);
        console.log('');

        // Test if we can query tables
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);

        console.log('📋 Tables in database:');
        if (tablesResult.recordset.length > 0) {
            tablesResult.recordset.forEach((row: any) => {
                console.log(`   - ${row.TABLE_NAME}`);
            });
        } else {
            console.log('   (No tables found - run .NET migrations first)');
        }
        console.log('');

        await pool.close();

        console.log('='.repeat(70));
        console.log('✅ DIAGNOSTIC COMPLETE - Connection is working!');
        console.log('='.repeat(70));

    } catch (error) {
        console.log('❌ CONNECTION FAILED!');
        console.log('');

        if (error instanceof Error) {
            console.log('Error Details:');
            console.log(`   Message: ${error.message}`);
            console.log(`   Name: ${error.name}`);
        }
        console.log('');

        console.log('🔧 Troubleshooting Steps:');
        console.log('   1. Check if LocalDB is installed:');
        console.log('      sqllocaldb info');
        console.log('');
        console.log('   2. Start LocalDB instance:');
        console.log('      sqllocaldb start mssqllocaldb');
        console.log('');
        console.log('   3. Check LocalDB status:');
        console.log('      sqllocaldb info mssqllocaldb');
        console.log('');
        console.log('   4. Run .NET app first to create database:');
        console.log('      cd ContosoUniversity/ContosoUniversity');
        console.log('      dotnet run');
        console.log('');
        console.log('='.repeat(70));
    }

    process.exit(0);
}

diagnoseConnection();
