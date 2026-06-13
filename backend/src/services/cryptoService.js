const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes IV is standard for GCM
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

// Fallback key for development. Production must override with a 32-byte key.
const DEFAULT_KEY = 'medihist-secret-encryption-key-32b'; // 32 characters
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? String(process.env.ENCRYPTION_KEY).padEnd(32, 'a').substring(0, 32)
  : DEFAULT_KEY;

if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️ WARNING: ENCRYPTION_KEY is not defined in env. Using local default key for field-level encryption.');
}

/**
 * Encrypts cleartext using AES-256-GCM
 * @param {string} text Plain text to encrypt
 * @returns {string} Encrypted string in format: ivHex:authTagHex:encryptedHex
 */
const encrypt = (text) => {
  if (text === null || text === undefined || text === '') {
    return '';
  }
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('❌ Encryption error:', error.message);
    throw new Error('Failed to encrypt sensitive data');
  }
};

/**
 * Decrypts ciphertext format back to plain text
 * @param {string} cipherText Ciphertext in format: ivHex:authTagHex:encryptedHex
 * @returns {string} Decrypted plain text
 */
const decrypt = (cipherText) => {
  if (cipherText === null || cipherText === undefined || cipherText === '') {
    return '';
  }
  
  // Return early if the text is not in the encrypted format (e.g. legacy plain text)
  if (!cipherText.includes(':')) {
    return cipherText;
  }
  
  try {
    const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) {
      return cipherText; // Return original if format doesn't match
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error (check ENCRYPTION_KEY settings):', error.message);
    // Returns a fallback label to prevent application crash on corrupted/stale keys
    return '[Decryption Error]';
  }
};

module.exports = {
  encrypt,
  decrypt
};
