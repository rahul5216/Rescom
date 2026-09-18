package com.rescom.data.db

import androidx.room.Dao
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val messageId: String,
    val conversationId: String,
    val senderId: String,
    val receiverId: String?,
    val content: String,
    val messageType: String,
    val status: String,
    val createdAt: Long,
    val isEncrypted: Boolean,
    val relayCount: Int
)

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE conversationId = :convId ORDER BY createdAt ASC")
    suspend fun getMessagesForConversation(convId: String): List<MessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Query("UPDATE messages SET status = :status WHERE messageId = :id")
    suspend fun updateStatus(id: String, status: String)
}

@Entity(tableName = "peers")
data class PeerEntity(
    @PrimaryKey val peerId: String,
    val displayName: String,
    val deviceId: String,
    val publicKey: String?,
    val lastSeen: Long,
    val connectionState: String,
    val preferredTransport: String,
    val rssi: Int,
    val hopCount: Int,
    val relayPeerId: String?
)

@Dao
interface PeerDao {
    @Query("SELECT * FROM peers ORDER BY lastSeen DESC")
    suspend fun getAllPeers(): List<PeerEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPeer(peer: PeerEntity)

    @Query("SELECT * FROM peers WHERE peerId = :id")
    suspend fun getPeerById(id: String): PeerEntity?
}
