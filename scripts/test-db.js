const fs = require('fs');
const path = require('path');
const prismaLib = require('@prisma/client');
const { PrismaClient } = prismaLib;

// Manually read .env
const envPath = path.join(__dirname, '..', '.env');
let databaseUrl = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
        if (line.startsWith('DATABASE_URL=')) {
            databaseUrl = line.split('=')[1].trim();
            // Remove quotes if present
            if (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) {
                databaseUrl = databaseUrl.slice(1, -1);
            }
            break;
        }
    }
}

console.log('Using DATABASE_URL:', databaseUrl ? 'Found (length: ' + databaseUrl.length + ')' : 'Not Found');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    }
});

async function main() {
    console.log('Testing database connection...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Successfully connected! Found ${userCount} users.`);
    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
