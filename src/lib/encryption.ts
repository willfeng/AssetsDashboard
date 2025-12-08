import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    console.warn("Warning: ENCRYPTION_KEY is not set or invalid length. It should be a 64-char hex string.");
}

export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not set");

    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');

    // Upgrade to GCM (Authenticated Encryption)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
    if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not set");

    const parts = text.split(':');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');

    // Scenario 1: Legacy CBC Format (iv:encrypted)
    if (parts.length === 2) {
        const [ivHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    // Scenario 2: New GCM Format (iv:tag:encrypted)
    if (parts.length === 3) {
        const [ivHex, tagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    throw new Error('Invalid encrypted text format');
}
