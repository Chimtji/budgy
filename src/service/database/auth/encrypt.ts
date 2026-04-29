import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is not set');
}

// Convert hex string to buffer
const key = Buffer.from(ENCRYPTION_KEY, 'hex');

if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (256 bits) when converted from hex');
}

export interface EncryptedData {
  iv: string;
  encryptedData: string;
  authTag: string;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptToken(plaintext: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt encrypted data using AES-256-GCM
 */
export function decryptToken(encrypted: EncryptedData): string {
  const iv = Buffer.from(encrypted.iv, 'hex');
  const authTag = Buffer.from(encrypted.authTag, 'hex');
  const encryptedBuffer = Buffer.from(encrypted.encryptedData, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

  return decrypted.toString('utf8');
}
