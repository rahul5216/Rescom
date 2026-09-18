package com.rescom.domain.model

/**
 * Represents an in-progress or completed chunked file transfer in Rescom.
 * Files are split into 64KB chunks and verified via SHA-256 hash.
 */
data class FileTransfer(
    val transferId: String,
    val messageId: String,
    val peerId: String,              // Sender or receiver peer ID
    val direction: TransferDirection,
    val filename: String,
    val mimeType: String,
    val fileSizeBytes: Long,
    val bytesTransferred: Long,
    val chunkCount: Int,
    val chunksAcknowledged: Int,
    val sha256Hash: String,          // SHA-256 checksum of the complete file
    val localUri: String?,           // Local file path once transfer is complete
    val status: TransferStatus,
    val createdAt: Long,             // Unix epoch millis
    val completedAt: Long? = null,
) {
    val progressFraction: Float
        get() = if (fileSizeBytes > 0) bytesTransferred.toFloat() / fileSizeBytes.toFloat() else 0f

    val progressPercent: Int
        get() = (progressFraction * 100).toInt()
}

enum class TransferDirection {
    INCOMING, OUTGOING
}

enum class TransferStatus {
    PENDING,       // Offer sent, awaiting acceptance
    TRANSFERRING,  // Chunks actively being sent/received
    PAUSED,        // Transfer paused by user
    COMPLETED,     // All chunks received & SHA-256 verified
    FAILED,        // Transfer failed or hash mismatch
    CANCELLED      // Cancelled by sender or receiver
}
