const fs = require('fs');
const path = require('path');

const envContent = `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aGVscGZ1bC1raXdpLTE2LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_Dm2t54g6CQlC2lydnbWGMljvWm8hEzD7YCPDhM1PQZ
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

DATABASE_URL=postgresql://postgres.zzrbzrgfqofojbvmko:86a5aeaef246d894fda01b90@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

ENCRYPTION_KEY=8bcca2b90f8e1234567890abcdef1234567890abcdef1234567890abcdef1234
`;

const envPath = path.join(__dirname, '.env');

// Write with UTF-8 encoding, no BOM
fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });

console.log('✓ .env file created successfully');
console.log('File size:', fs.statSync(envPath).size, 'bytes');
console.log('Content preview:');
console.log(fs.readFileSync(envPath, 'utf8').substring(0, 200) + '...');
