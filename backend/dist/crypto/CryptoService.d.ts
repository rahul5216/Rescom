export interface EncryptedPayload {
    iv: string;
    authTag: string;
    ciphertext: string;
}
export interface KeyPairResult {
    publicKeyPem: string;
    privateKeyPem: string;
    publicKeyHex: string;
}
export declare class CryptoService {
    /**
     * Generate an ECDH (prime256v1) key pair for asymmetric key agreement
     */
    static generateKeyPair(): KeyPairResult;
    /**
     * Derive a shared symmetric key (AES-256) using ECDH Diffie-Hellman
     */
    static deriveSharedSecret(localPrivateKeyPem: string, peerPublicKeyPem: string): Buffer;
    /**
     * Encrypt plaintext string or buffer using AES-256-GCM with authentication tag
     */
    static encryptPayload(data: string | Buffer, symmetricKey: Buffer): EncryptedPayload;
    /**
     * Decrypt AES-256-GCM payload and verify integrity tag
     * Throws error if ciphertext or tag was tampered with
     */
    static decryptPayload(payload: EncryptedPayload, symmetricKey: Buffer): string;
    /**
     * Digital signature creation using ECDSA SHA-256
     */
    static signData(data: string | Buffer, privateKeyPem: string): string;
    /**
     * Digital signature verification using ECDSA SHA-256
     */
    static verifySignature(data: string | Buffer, signatureBase64: string, publicKeyPem: string): boolean;
    /**
     * Compute SHA-256 hash (hex)
     */
    static sha256(data: string | Buffer): string;
    /**
     * Generate a unique device identifier based on public key hash
     */
    static computeDeviceId(publicKeyPem: string): string;
}
