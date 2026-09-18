"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
class CryptoService {
    /**
     * Generate an ECDH (prime256v1) key pair for asymmetric key agreement
     */
    static generateKeyPair() {
        const ecdh = node_crypto_1.default.createECDH('prime256v1');
        ecdh.generateKeys();
        const publicKeyHex = ecdh.getPublicKey('hex');
        const privateKeyHex = ecdh.getPrivateKey('hex');
        // Also generate standard exportable key objects for signing
        const { publicKey, privateKey } = node_crypto_1.default.generateKeyPairSync('ec', {
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
    static deriveSharedSecret(localPrivateKeyPem, peerPublicKeyPem) {
        // Derive shared secret using crypto.diffieHellman
        const privKey = node_crypto_1.default.createPrivateKey(localPrivateKeyPem);
        const pubKey = node_crypto_1.default.createPublicKey(peerPublicKeyPem);
        const secret = node_crypto_1.default.diffieHellman({
            privateKey: privKey,
            publicKey: pubKey,
        });
        // Hash secret using SHA-256 to ensure exact 32-byte key for AES-256
        return node_crypto_1.default.createHash('sha256').update(secret).digest();
    }
    /**
     * Encrypt plaintext string or buffer using AES-256-GCM with authentication tag
     */
    static encryptPayload(data, symmetricKey) {
        if (symmetricKey.length !== 32) {
            throw new Error('Symmetric key must be 32 bytes for AES-256-GCM');
        }
        const iv = node_crypto_1.default.randomBytes(12); // Standard 96-bit IV for GCM
        const cipher = node_crypto_1.default.createCipheriv('aes-256-gcm', symmetricKey, iv);
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
    static decryptPayload(payload, symmetricKey) {
        if (symmetricKey.length !== 32) {
            throw new Error('Symmetric key must be 32 bytes for AES-256-GCM');
        }
        const iv = Buffer.from(payload.iv, 'base64');
        const authTag = Buffer.from(payload.authTag, 'base64');
        const ciphertext = Buffer.from(payload.ciphertext, 'base64');
        const decipher = node_crypto_1.default.createDecipheriv('aes-256-gcm', symmetricKey, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('utf8');
    }
    /**
     * Digital signature creation using ECDSA SHA-256
     */
    static signData(data, privateKeyPem) {
        const sign = node_crypto_1.default.createSign('SHA256');
        sign.update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data);
        sign.end();
        return sign.sign(privateKeyPem, 'base64');
    }
    /**
     * Digital signature verification using ECDSA SHA-256
     */
    static verifySignature(data, signatureBase64, publicKeyPem) {
        try {
            const verify = node_crypto_1.default.createVerify('SHA256');
            verify.update(typeof data === 'string' ? Buffer.from(data, 'utf8') : data);
            verify.end();
            return verify.verify(publicKeyPem, signatureBase64, 'base64');
        }
        catch {
            return false;
        }
    }
    /**
     * Compute SHA-256 hash (hex)
     */
    static sha256(data) {
        return node_crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    /**
     * Generate a unique device identifier based on public key hash
     */
    static computeDeviceId(publicKeyPem) {
        return 'cg-node-' + node_crypto_1.default.createHash('sha256').update(publicKeyPem).digest('hex').substring(0, 16);
    }
}
exports.CryptoService = CryptoService;
