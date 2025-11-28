
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Replace the password
content = content.replace(
    ':86a5aeaef246d894fda01b90@',
    ':88ef246d894fda01b9086a5aea@'
);

fs.writeFileSync(envPath, content, 'utf8');
console.log('Updated .env with corrected password');
