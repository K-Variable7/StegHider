// utils/clueEncryption.ts
import { hexlify, randomBytes } from 'ethers';

export async function encryptClue(clue: string, key?: CryptoKey): Promise<string> {
  if (!key) {
    // Generate a new key for this clue
    key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedClue = new TextEncoder().encode(clue);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedClue
  );

  // Export key for storage (in production, securely store/share key)
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const keyHex = hexlify(new Uint8Array(exportedKey));
  const ivHex = hexlify(iv);
  const encryptedHex = hexlify(new Uint8Array(encrypted));

  return `${keyHex}:${ivHex}:${encryptedHex}`;
}

export async function decryptClue(encryptedData: string): Promise<string> {
  const [keyHex, ivHex, encryptedHex] = encryptedData.split(':');

  const keyData = new Uint8Array(Buffer.from(keyHex.slice(2), 'hex'));
  const iv = new Uint8Array(Buffer.from(ivHex.slice(2), 'hex'));
  const encrypted = new Uint8Array(Buffer.from(encryptedHex.slice(2), 'hex'));

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}