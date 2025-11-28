import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    // Note: The generated key in .env is hex, so 32 bytes = 64 hex chars.
    // If we used a raw string, it would be 32 chars.
    // We'll assume the key in env is a HEX string of 32 bytes.
    console.warn("Warning: ENCRYPTION_KEY is not set or invalid length. It should be a 64-char hex string.");
}

export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not set");

    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not set");

    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}
