package com.rescom.data.db

import androidx.room.*
import com.rescom.domain.model.Message
import com.rescom.domain.model.MessageStatus
import com.rescom.domain.model.MessageType
import kotlinx.coroutines.flow.Flow

// ─── Room Entity ─────────────────────────────────────────────────────────────

@Entity(
    tableName = "messages",
    indices = [
        Index("conversationId"),
        Index("senderId"),
        Index("status"),
    ]
)
data class MessageEntity(
    @PrimaryKey val messageId: String,
    val conversationId: String,
    val senderId: String,
    val receiverId: String,
    val content: String,           // Base64 ciphertext for encrypted messages
    val messageType: String,       // MessageType enum name
    val isEncrypted: Boolean,
    val status: String,            // MessageStatus enum name
    val hopCount: Int,
    val signature: String,
    val createdAt: Long,
    val expiresAt: Long?,
)

// ─── DAO ─────────────────────────────────────────────────────────────────────

@Dao
interface MessageDao {
    @Query("""
        SELECT * FROM messages 
        WHERE conversationId = :convId 
        ORDER BY createdAt ASC
    """)
    fun observeByConversation(convId: String): Flow<List<MessageEntity>>

    @Query("""
        SELECT * FROM messages 
        WHERE status IN ('QUEUED', 'SENDING') 
        ORDER BY createdAt ASC
    """)
    suspend fun getPendingMessages(): List<MessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Query("UPDATE messages SET status = :status WHERE messageId = :id")
    suspend fun updateStatus(id: String, status: String)

    @Query("DELETE FROM messages WHERE expiresAt IS NOT NULL AND expiresAt < :before")
    suspend fun deleteExpired(before: Long)

    @Query("SELECT * FROM messages ORDER BY createdAt DESC LIMIT :limit")
    suspend fun getRecent(limit: Int): List<MessageEntity>

    @Query("SELECT COUNT(*) FROM messages WHERE conversationId = :convId")
    suspend fun countByConversation(convId: String): Int
}

// ─── Mapper extensions ────────────────────────────────────────────────────────

fun MessageEntity.toDomain(): Message = Message(
    messageId = messageId,
    conversationId = conversationId,
    senderId = senderId,
    receiverId = receiverId,
    content = content,
    messageType = MessageType.valueOf(messageType),
    isEncrypted = isEncrypted,
    status = MessageStatus.valueOf(status),
    hopCount = hopCount,
    signature = signature,
    createdAt = createdAt,
    expiresAt = expiresAt,
)

fun Message.toEntity(): MessageEntity = MessageEntity(
    messageId = messageId,
    conversationId = conversationId,
    senderId = senderId,
    receiverId = receiverId,
    content = content,
    messageType = messageType.name,
    isEncrypted = isEncrypted,
    status = status.name,
    hopCount = hopCount,
    signature = signature,
    createdAt = createdAt,
    expiresAt = expiresAt,
)
