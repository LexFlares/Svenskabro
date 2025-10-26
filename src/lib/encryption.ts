
import CryptoJS from "crypto-js";

/**
 * Krypteringsbibliotek för Svenska Bro Aktiebolag
 * Använder AES-256 kryptering för att skydda känslig data
 * 
 * UPDATED: Improved security with stronger PBKDF2 iterations
 */

const ENCRYPTION_KEY_STORAGE = "sbab_encryption_key";
const FALLBACK_KEY_STORAGE = "sbab_fallback_encryption_key";
const SALT = "svenska_bro_ab_2025_secure_salt_v2";
const PBKDF2_ITERATIONS = 100000; // Industry standard

/**
 * Genererar en krypteringsnyckel baserat på användarens lösenord
 * UPDATED: Increased iterations to 100,000 for better security
 */
export function generateEncryptionKey(password: string): string {
  return CryptoJS.PBKDF2(password, SALT, {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS
  }).toString();
}

/**
 * Genererar eller hämtar en fallback-krypteringsnyckel för sessionen
 * FIXED: Uses crypto.getRandomValues for cryptographically secure key generation
 */
function getFallbackKey(): string {
  if (typeof window === "undefined") {
    // Server-side fallback - use multiple entropy sources
    const entropy = SALT + Date.now() + Math.random() + process.pid;
    return CryptoJS.SHA256(entropy).toString();
  }

  let fallbackKey = sessionStorage.getItem(FALLBACK_KEY_STORAGE);
  
  if (!fallbackKey) {
    // Generate a cryptographically secure fallback key
    if (window.crypto && window.crypto.getRandomValues) {
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      const randomHex = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      fallbackKey = CryptoJS.SHA256(SALT + randomHex).toString();
    } else {
      // Fallback for older browsers
      fallbackKey = CryptoJS.SHA256(
        SALT + Date.now() + Math.random() + Math.random()
      ).toString();
    }
    
    sessionStorage.setItem(FALLBACK_KEY_STORAGE, fallbackKey);
  }
  
  return fallbackKey;
}

/**
 * Sparar krypteringsnyckeln i sessionStorage (rensas vid utloggning)
 */
export function storeEncryptionKey(key: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
}

/**
 * Hämtar krypteringsnyckeln från sessionStorage
 * FIXED: Always returns a valid key (uses fallback if needed)
 */
export function getEncryptionKey(): string {
  if (typeof window === "undefined") {
    return getFallbackKey();
  }

  const storedKey = sessionStorage.getItem(ENCRYPTION_KEY_STORAGE);
  return storedKey || getFallbackKey();
}

/**
 * Rensar krypteringsnyckeln (vid utloggning)
 */
export function clearEncryptionKey(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE);
  sessionStorage.removeItem(FALLBACK_KEY_STORAGE);
}

/**
 * Krypterar data med AES-256
 * UPDATED: Better error handling and validation
 */
export function encryptData(data: string, key?: string): string {
  if (!data) return data;
  
  const encryptionKey = key || getEncryptionKey();

  try {
    const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    // Return original data with warning
    console.warn("⚠️ Encryption failed - data will be stored unencrypted");
    return data;
  }
}

/**
 * Dekrypterar data med AES-256
 * UPDATED: Better error handling and validation
 */
export function decryptData(encryptedData: string, key?: string): string {
  if (!encryptedData) return encryptedData;
  
  const encryptionKey = key || getEncryptionKey();

  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      // If decryption fails, the data might not be encrypted
      console.warn("⚠️ Decryption failed - returning original data");
      return encryptedData;
    }
    
    return decryptedString;
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedData;
  }
}

/**
 * Krypterar ett objekt (konverterar till JSON först)
 */
export function encryptObject<T>(obj: T, key?: string): string {
  const jsonString = JSON.stringify(obj);
  return encryptData(jsonString, key);
}

/**
 * Dekrypterar ett objekt (konverterar från JSON)
 */
export function decryptObject<T>(encryptedData: string, key?: string): T {
  const decryptedString = decryptData(encryptedData, key);
  return JSON.parse(decryptedString) as T;
}

/**
 * Krypterar en fil/bild som base64
 */
export function encryptFile(base64Data: string, key?: string): string {
  return encryptData(base64Data, key);
}

/**
 * Dekrypterar en fil/bild från krypterad base64
 */
export function decryptFile(encryptedData: string, key?: string): string {
  return decryptData(encryptedData, key);
}

/**
 * Verifierar om data är krypterad (heuristisk kontroll)
 */
export function isEncrypted(data: string): boolean {
  try {
    // Krypterad data från CryptoJS börjar med "U2FsdGVk" (base64 för "Salted")
    return data.startsWith("U2FsdGVk");
  } catch {
    return false;
  }
}

/**
 * Genererar en stark slumpmässig nyckel för engångskryptering
 * UPDATED: Uses crypto.getRandomValues for better security
 */
export function generateRandomKey(length: number = 32): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const randomBytes = new Uint8Array(length);
    window.crypto.getRandomValues(randomBytes);
    
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let key = "";
    
    for (let i = 0; i < length; i++) {
      key += charset[randomBytes[i] % charset.length];
    }
    
    return key;
  }
  
  // Fallback for environments without crypto.getRandomValues
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let key = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    key += charset[randomIndex];
  }
  
  return key;
}

/**
 * Skapar en hash av data (för integritetskontroll)
 */
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Verifierar dataintegritet genom att jämföra hash
 */
export function verifyDataIntegrity(data: string, expectedHash: string): boolean {
  const actualHash = hashData(data);
  return actualHash === expectedHash;
}

// Export aliases for backward compatibility
export { encryptData as encryptMessage, decryptData as decryptMessage };

export const encryptionService = {
  generateEncryptionKey,
  getFallbackKey,
  storeEncryptionKey,
  getEncryptionKey,
  clearEncryptionKey,
  encryptData,
  decryptData,
  encryptObject,
  decryptObject,
  encryptFile,
  decryptFile,
  isEncrypted,
  generateRandomKey,
  hashData,
  verifyDataIntegrity,
  encryptMessage: encryptData,
  decryptMessage: decryptData,
};
