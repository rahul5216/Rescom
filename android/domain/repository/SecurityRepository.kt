package com.rescom.domain.repository

import com.rescom.domain.model.User

/**
 * Security Repository contract — manages cryptographic identity and session keys.
 * Responsible for key generation, storage (Keystore), and ECDH session management.
 */
interface SecurityRepository {
    /**
     * Initialize the local user identity.
     * Generates an ECDSA P-256 key pair, stores the private key in Android Keystore,
     * and persists the public profile to Room DB.
     * Call once on first launch; subsequent calls return the existing identity.
     */
    suspend fun initializeIdentity(displayName: String, department: String, semester: String): User

    /** Retrieve the locally stored user identity. */
    suspend fun getLocalUser(): User?

    /**
     * Perform ECDH key agreement with a peer.
     * Returns a 32-byte shared secret as a hex string, used for AES-256-GCM session key derivation.
     */
    suspend fun deriveSharedSecret(peerPublicKeyPem: String): ByteArray

    /**
     * Encrypt a plaintext message payload for a specific peer session.
     * Uses AES-256-GCM with a random 12-byte IV.
     * Returns Base64-encoded ciphertext with the IV prepended.
     */
    suspend fun encryptForPeer(peerId: String, plaintext: ByteArray): ByteArray

    /**
     * Decrypt a received ciphertext payload from a peer session.
     * Throws [SecurityException] if authentication tag verification fails (tampered data).
     */
    suspend fun decryptFromPeer(peerId: String, ciphertext: ByteArray): ByteArray

    /**
     * Sign a packet hash with the local ECDSA private key.
     * Signature is Base64-encoded and appended to each outgoing Packet.
     */
    suspend fun signData(data: ByteArray): ByteArray

    /**
     * Verify a packet's ECDSA signature against the sender's known public key.
     * Returns true if the signature is valid, false if it has been tampered.
     */
    suspend fun verifySignature(data: ByteArray, signature: ByteArray, senderPublicKeyPem: String): Boolean

    /** Update the user's display name and campus metadata. */
    suspend fun updateProfile(displayName: String, department: String, semester: String)
}
