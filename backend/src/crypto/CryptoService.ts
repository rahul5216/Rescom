import crypto from 'node:crypto';

export interface EncryptedPayload {
  iv: string;         // Base64 12-byte IV
  authTag: string;    // Base64 16-byte GCM authentication tag
  ciphertext: string; // Base64 encrypted ciphertext
}

export interface KeyPairResult {
  publicKeyPem: string;
  privateKeyPem: string;
  publicKeyHex: string;
}

export class CryptoService {
  /**
   * Generate an ECDH (prime256v1) key pair for asymmetric key agreement
   */
  public static generateKeyPair(): KeyPairResult {
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();

    const publicKeyHex = ecdh.getPublicKey('hex');
    const privateKeyHex = ecdh.getPrivateKey('hex');

    // Also generate standard exportable key objects for signing
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return {
      publicKeyPem: publicKey,
      privateKeyPem: privateKey,
      publicKeyHex: publicKeyHex,
    };
  }

  /**
   * Derive a shared symmetric key (AES-256) using ECDH Diffie-Hellman
   */
  public static deriveSharedSecret(localPrivateKeyPem: string, peerPublicKeyPem: string): Buffer {
    // Derive shared secret using crypto.diffieHellman
    const privKey = crypto.createPrivateKey(localPrivateKeyPem);
    const pubKey = crypto.createPublicKey(peerPublicKeyPem);

    const secret = crypto.diffieHellman({
      privateKey: privKey,
      publicKey: pubKey,
    });

    // Hash secret using SHA-256 to ensure exact 32-byte key for AES-256
    return crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Encrypt plaintext string or buffer using AES-256-GCM with authentication tag
   */
  public static encryptPayload(data: string | Buffer, symmetricKey: Buffer): EncryptedPayload {
    if (symmetricKey.length !== 32) {
      throw new Error('Symmetric key must be 32 bytes for AES-256-GCM');
    }

    const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', symmetricKey, iv);

    const inputBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const ciphertext = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
  }

  /**
   * Decrypt AES-256-GCM payload and verify integrity tag
   * Throws error if ciphertext or tag was tampered with
   */
  public static decryptPayload(payload: EncryptedPayload, symmetricKey: Buffer): string {
    if (symmetricKey.length !== 32) {
      throw new Error('Symmetric key must be 32 bytes for AES-256-GCM');
    }

    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', symmetricKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  }

  /**
   * Digital signature creation using ECDSA SHA-256
   */
  public static signData(data: string | Buffer, privateKeyPem: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data);
    sign.end();
    return sign.sign(privateKeyPem, 'base64');
  }

  /**
   * Digital signature verification using ECDSA SHA-256
   */
  public static verifySignature(data: string | Buffer, signatureBase64: string, publicKeyPem: string): boolean {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data);
      verify.end();
      return verify.verify(publicKeyPem, signatureBase64, 'base64');
    } catch {
      return false;
    }
  }

  /**
   * Compute SHA-256 hash (hex)
   */
  public static sha256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a unique device identifier based on public key hash
   */
  public static computeDeviceId(publicKeyPem: string): string {
    return 'cg-node-' + crypto.createHash('sha256').update(publicKeyPem).digest('hex').substring(0, 16);
  }
}
