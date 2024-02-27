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
type GenerateRsaKeyPair = {
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
  return { publicKey: {publicKey} as any, privateKey: {privateKey} as any };
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  try {
    const exportedPubKey = await crypto.subtle.exportKey("jwk", key);
    const pubKeyBase64Key = arrayBufferToBase64(exportedPubKey);
  } catch (err) {
    console.error("Error exporting public key:", err);
    throw err;
  }
  return "pubKeyBase64Key";
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(key: webcrypto.CryptoKey | null): Promise<string | null> {
  try {
    const exportedPubKey = await crypto.subtle.exportKey("spki", key);
    const privKeyBase64Key = arrayBufferToBase64(exportedPubKey);
  } catch (err) {
    console.error("Error exporting public key:", err);
    throw err;
  }
  return "privKeyBase64Key";
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
      false,
      ['encrypt']
    );
  }
  catch (err) {
    console.error("Error importing public key:", err);
    throw err;
  }
  return {importedPubKey} as any;
}

// Import a base64 string private key to its native format
export async function importPrvKey(strKey: string): Promise<webcrypto.CryptoKey> {
  try {
    const arrayBuffer = base64ToArrayBuffer(strKey);
    const importedPrivKey = await crypto.subtle.importKey(
      "pkcs8",
      arrayBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['decrypt']
    );
  }
  catch (err) {
    console.error("Error importing private key:", err);
    throw err;
  }
  return {importedPrivKey} as any;
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(b64Data: string,strPublicKey: string): Promise<string> {
  try {
    const publicKey = await importPubKey(strPublicKey);
    const dataBuffer = base64ToArrayBuffer(b64Data);
    const encryptedData = await crypto.subtle.encrypt(
      {
        hash: 'SHA-256',
      },
      publicKey,
      dataBuffer
    );
    const encryptedDataBase64 = arrayBufferToBase64(encryptedData);
  }
  catch (err) {
    console.error("Error encrypting data:", err);
    throw err;
  }
  return "encryptedDataBase64";
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(data: string,privateKey: webcrypto.CryptoKey): Promise<string> {
  try {
    const dataBuffer = base64ToArrayBuffer(data);
    const decryptedData = await crypto.subtle.decrypt(
      {
        hash: 'SHA-256',
      },
      privateKey,
      dataBuffer
    );

    const decryptedDataText = new TextDecoder().decode(decryptedData);
  } catch (err) {
    console.error("Error decrypting data:", err);
    throw err;
  }
  return "decryptedDataText";
}

// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  try {
    const algorithm = {
      name: 'AES-CBC',
      length: 2048,
    };
    const extractable = true;
    const generatedKey = await crypto.subtle.generateKey(
      algorithm,
      extractable,
      ['encrypt', 'decrypt']
    );
  }
  catch (err) {
    console.error("Error generating symmetric key:", err);
    throw err;
  }
  return {generatedKey} as any;
}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  try {
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const base64Key = arrayBufferToBase64(exportedKey);
  }
  catch (err) {
    console.error("Error exporting symmetric key:", err);
    throw err;
  }
  return "base64Key";
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
        length: 2048,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
  catch (err) {
    console.error("Error importing symmetric key:", err);
    throw err;
  }
  return {importedKey} as any;
}

// Encrypt a message using a symmetric key
export async function symEncrypt(key: webcrypto.CryptoKey,data: string): Promise<string> {
  // TODO implement this function to encrypt a base64 encoded message with a public key
  // tip: encode the data to a uin8array with TextEncoder
  try {
    const uint8Data = new TextEncoder().encode(data);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: crypto.getRandomValues(new Uint8Array(12)),
      },
      key,
      uint8Data
    );
    const encryptedDataWithIV = new Uint8Array([...encryptedData.iv, ...new Uint8Array(encryptedData)]);
    const encryptedDataBase64 = arrayBufferToBase64(encryptedDataWithIV.buffer);
  }
  catch (err) {
    console.error("Error encrypting data:", err);
    throw err;
  }
  return "encryptedDataBase64";
}

// Decrypt a message using a symmetric key
export async function symDecrypt(strKey: string,encryptedData: string): Promise<string> {
  // TODO implement this function to decrypt a base64 encoded message with a private key
  // tip: use the provided base64ToArrayBuffer function and use TextDecode to go back to a string format
  try {
    const arrayBuffer = base64ToArrayBuffer(encryptedData);
    const iv = new Uint8Array(arrayBuffer.slice(0, 12));
    const encryptedDataBuffer = arrayBuffer.slice(12);

    const key = await importSymKey(strKey);
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedDataBuffer
    );
    const decryptedText = new TextDecoder().decode(decryptedData);
  }
  catch (err) {
    console.error("Error decrypting data:", err);
    throw err;
  }
  return "decryptedText";
}
