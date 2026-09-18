package com.rescom.domain.repository

import com.rescom.domain.model.Message
import kotlinx.coroutines.flow.Flow

/**
 * Message Repository contract — Clean Architecture interface that the Data layer implements.
 * All operations are suspend-based for coroutine compatibility.
 */
interface MessageRepository {
    /**
     * Observe all messages in a conversation as a reactive Flow.
     * Emits a new list whenever a new message arrives or a status changes.
     */
    fun observeMessages(conversationId: String): Flow<List<Message>>

    /** Insert or replace a message record. */
    suspend fun saveMessage(message: Message)

    /** Update delivery status of an existing message (e.g. SENT → DELIVERED). */
    suspend fun updateStatus(messageId: String, status: com.rescom.domain.model.MessageStatus)

    /** Retrieve all messages queued for offline delivery (store-and-forward). */
    suspend fun getPendingMessages(): List<Message>

    /** Delete messages older than the given epoch millis (data expiry). */
    suspend fun deleteExpiredMessages(beforeEpochMs: Long)

    /** Get the last N messages across all conversations for dashboard preview. */
    suspend fun getRecentMessages(limit: Int = 20): List<Message>
}
