package com.rescom.domain.model

enum class MessageStatus {
    QUEUED,
    SENDING,
    SENT,
    DELIVERED,
    FAILED
}

data class Message(
    val messageId: String,
    val conversationId: String,
    val senderId: String,
    val receiverId: String?,
    val content: String,
    val messageType: String = "TEXT",
    val status: MessageStatus = MessageStatus.SENDING,
    val createdAt: Long = System.currentTimeMillis(),
    val expiresAt: Long? = null,
    val isEncrypted: Boolean = true,
    val relayCount: Int = 0
)

data class Peer(
    val peerId: String,
    val displayName: String,
    val deviceId: String,
    val publicKey: String?,
    val lastSeen: Long = System.currentTimeMillis(),
    val connectionState: String = "CONNECTED",
    val preferredTransport: String = "BLE",
    val rssi: Int = -60,
    val hopCount: Int = 1,
    val relayPeerId: String? = null
)
