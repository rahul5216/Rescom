package com.rescom.domain.model

/**
 * Local user profile for the Rescom application.
 * Stores cryptographic identity credentials and campus metadata.
 */
data class User(
    val userId: String,              // UUID v4 — unique device identifier
    val username: String,            // Campus username / student ID
    val displayName: String,
    val department: String,
    val semester: String,
    val deviceId: String,            // Hardware/device fingerprint
    val publicKey: String,           // PEM-encoded ECDSA P-256 public key
    val privateKey: String,          // PEM-encoded ECDSA P-256 private key (never transmitted)
    val createdAt: Long,             // Unix epoch millis
    val avatarSeed: Int = 0,         // Seed for procedurally generated avatar
) {
    /**
     * Returns a sanitized profile safe to share with peers (no private key).
     */
    fun toPublicProfile(): PublicProfile = PublicProfile(
        userId = userId,
        username = username,
        displayName = displayName,
        department = department,
        semester = semester,
        deviceId = deviceId,
        publicKey = publicKey,
    )
}

/**
 * Shareable public identity broadcast to other peers during the IDENTITY handshake.
 */
data class PublicProfile(
    val userId: String,
    val username: String,
    val displayName: String,
    val department: String,
    val semester: String,
    val deviceId: String,
    val publicKey: String,
)
