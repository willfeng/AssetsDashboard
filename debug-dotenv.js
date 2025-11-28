
const fs = require('fs');
const dotenv = require('dotenv');

const content = fs.readFileSync('.env', 'utf8');
console.log('Raw content length:', content.length);
console.log('First 50 chars:', JSON.stringify(content.substring(0, 50)));

const parsed = dotenv.parse(content);
console.log('Parsed keys:', Object.keys(parsed));
