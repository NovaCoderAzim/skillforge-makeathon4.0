const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    password: '0728',
    port: 5432,
    database: 'postgres' // Connect to default db first
});

async function createDb() {
    try {
        await client.connect();
        const res = await client.query("SELECT datname FROM pg_catalog.pg_database WHERE datname = 'skillforge_db'");
        
        if (res.rowCount === 0) {
            console.log("Database 'skillforge_db' not found, creating it.");
            await client.query('CREATE DATABASE skillforge_db');
            console.log("Database 'skillforge_db' created successfully.");
        } else {
            console.log("Database 'skillforge_db' already exists.");
        }
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await client.end();
    }
}

createDb();
