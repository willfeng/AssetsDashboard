const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

console.log("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exists:", !!envVars['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY']);
console.log("CLERK_SECRET_KEY exists:", !!envVars['CLERK_SECRET_KEY']);
console.log("NEXT_PUBLIC_CLERK_SIGN_IN_URL:", envVars['NEXT_PUBLIC_CLERK_SIGN_IN_URL']);
console.log("NEXT_PUBLIC_CLERK_SIGN_UP_URL:", envVars['NEXT_PUBLIC_CLERK_SIGN_UP_URL']);
console.log("NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:", envVars['NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL']);
console.log("NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:", envVars['NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL']);
