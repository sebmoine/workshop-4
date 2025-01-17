import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
export type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  const { publicKey, privateKey } = await crypto.subtle.generateKey({
    name: 'RSA-OAEP',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1,0,1]),
    hash: 'SHA-256'
  }, true,
  ['encrypt', 'decrypt']
  );
  return { publicKey: publicKey, privateKey: privateKey};
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  try {
    const exportedPubKey = await crypto.subtle.exportKey("spki", key);
    const pubKeyBase64Key = arrayBufferToBase64(exportedPubKey);
    return pubKeyBase64Key;
  } catch (err) {
    console.error("Error exporting public key:", err);
    throw err;
  }
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(key: webcrypto.CryptoKey | null): Promise<string | null> {
  try {
    if (key === null) {return null;}
    else {
      const exportedPrivKey = await crypto.subtle.exportKey('pkcs8', key);
      const privKeyBase64Key = arrayBufferToBase64(exportedPrivKey);
      return privKeyBase64Key;
    }
  } catch (err) {
    console.error("Error exporting private key:", err);
    throw err;
  }
}

// Import a base64 string public key to its native format
export async function importPubKey(strKey: string): Promise<webcrypto.CryptoKey> {
  try {
    const arrayBuffer = base64ToArrayBuffer(strKey);
    const importedPubKey = await crypto.subtle.importKey(
      'spki',
      arrayBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    );
    return importedPubKey;
  }
  catch (err) {
    console.error("Error importing public key:", err);
    throw err;
  }
}

// Import a base64 string private key to its native format
export async function importPrvKey(strKey: string): Promise<webcrypto.CryptoKey> {
  try {
    const arrayBuffer = base64ToArrayBuffer(strKey);
    const importedPrivKey = await crypto.subtle.importKey(
      'pkcs8',
      arrayBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['decrypt']
    );
    return importedPrivKey;
  }
  catch (err) {
    console.error("Error importing private key:", err);
    throw err;
  }
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(b64Data: string,strPublicKey: string): Promise<string> {
  try {
    const publicKey = await importPubKey(strPublicKey);
    const dataBuffer = base64ToArrayBuffer(b64Data);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      dataBuffer
    );
    const encryptedDataBase64 = arrayBufferToBase64(encryptedData);
    return encryptedDataBase64;
  }
  catch (err) {
    console.error("Error encrypting data:", err);
    throw err;
  }
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(data: string,privateKey: webcrypto.CryptoKey): Promise<string> {
  try {
    const dataBuffer = base64ToArrayBuffer(data);
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateKey,
      dataBuffer
    );
    const decryptedDataBase64 = arrayBufferToBase64(new Uint8Array(decryptedData));
    return decryptedDataBase64;
  } catch (err) {
    console.error("Error decrypting data:", err);
    throw err;
  }
}


// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  try {
    const generatedKey = await crypto.subtle.generateKey(
      {
        name: 'AES-CBC',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    return generatedKey;
  }
  catch (err) {
    console.error("Error generating symmetric key:", err);
    throw err;
  }
}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  try {
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const base64Key = arrayBufferToBase64(exportedKey);
    return base64Key;
  }
  catch (err) {
    console.error("Error exporting symmetric key:", err);
    throw err;
  }
}

// Import a base64 string format to its crypto native format
export async function importSymKey(strKey: string): Promise<webcrypto.CryptoKey> {
  try {
    const arrayBuffer = base64ToArrayBuffer(strKey);
    const importedKey = await crypto.subtle.importKey(
      'raw',
      arrayBuffer,
      {
        name: 'AES-CBC',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
    return importedKey;
  }
  catch (err) {
    console.error("Error importing symmetric key:", err);
    throw err;
  }
}

// Encrypt a message using a symmetric key
export async function symEncrypt(key: webcrypto.CryptoKey,data: string): Promise<string> {
  try {
    const encodedData = new TextEncoder().encode(data);
    const iv = webcrypto.getRandomValues(new Uint8Array(16));
    const encryptedData = await webcrypto.subtle.encrypt(
        {
            name: "AES-CBC",
            iv: iv,
        },
        key,
        encodedData
    );
    const encryptedDataWithIV = new Uint8Array(iv.length + encryptedData.byteLength);
    encryptedDataWithIV.set(iv);
    encryptedDataWithIV.set(new Uint8Array(encryptedData), iv.length);
    const encryptedDataBase64 = arrayBufferToBase64(encryptedDataWithIV);
    return encryptedDataBase64;
  }
  catch (err) {
    console.error("Error encrypting data:", err);
    throw err;
  }
}

// Decrypt a message using a symmetric key
export async function symDecrypt(strKey: string,encryptedData: string): Promise<string> {
  try {
    const encryptedDataWithIV = base64ToArrayBuffer(encryptedData);
    const iv = new Uint8Array(encryptedDataWithIV.slice(0, 16));
    const encryptedDataBuffer = encryptedDataWithIV.slice(16);
    const simKey = await importSymKey(strKey);
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv,
      },
      simKey,
      encryptedDataBuffer
    );
    const decryptedText = new TextDecoder().decode(decryptedData);
    return decryptedText;
  }
  catch (err) {
    console.error("Error decrypting data:", err);
    throw err;
  }
}