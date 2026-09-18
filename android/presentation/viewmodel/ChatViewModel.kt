package com.rescom.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rescom.domain.model.Message
import com.rescom.domain.model.MessageStatus
import com.rescom.domain.repository.MessageRepository
import com.rescom.domain.repository.SecurityRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ChatUiState(
    val messages: List<Message> = emptyList(),
    val isEncryptionEnabled: Boolean = true,
    val isSending: Boolean = false,
    val error: String? = null,
)

/**
 * ViewModel for the Chat / Messaging screen.
 * Handles end-to-end encrypted message send/receive flows using AES-256-GCM.
 */
@HiltViewModel
class ChatViewModel @Inject constructor(
    private val messageRepo: MessageRepository,
    private val securityRepo: SecurityRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private var currentConversationId: String? = null

    fun loadConversation(conversationId: String) {
        currentConversationId = conversationId
        viewModelScope.launch {
            messageRepo.observeMessages(conversationId)
                .catch { e -> _uiState.update { it.copy(error = e.message) } }
                .collect { msgs ->
                    _uiState.update { it.copy(messages = msgs, error = null) }
                }
        }
    }

    fun sendMessage(receiverId: String, plaintext: String) {
        val convId = currentConversationId ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isSending = true, error = null) }
            try {
                val content = if (_uiState.value.isEncryptionEnabled) {
                    val encrypted = securityRepo.encryptForPeer(receiverId, plaintext.toByteArray(Charsets.UTF_8))
                    android.util.Base64.encodeToString(encrypted, android.util.Base64.NO_WRAP)
                } else {
                    plaintext
                }

                val message = Message(
                    messageId = java.util.UUID.randomUUID().toString(),
                    conversationId = convId,
                    senderId = securityRepo.getLocalUser()?.userId ?: "unknown",
                    receiverId = receiverId,
                    content = content,
                    messageType = com.rescom.domain.model.MessageType.TEXT,
                    isEncrypted = _uiState.value.isEncryptionEnabled,
                    status = MessageStatus.QUEUED,
                    hopCount = 0,
                    signature = "",
                    createdAt = System.currentTimeMillis(),
                )
                messageRepo.saveMessage(message)
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to send: ${e.message}") }
            } finally {
                _uiState.update { it.copy(isSending = false) }
            }
        }
    }

    fun toggleEncryption() {
        _uiState.update { it.copy(isEncryptionEnabled = !it.isEncryptionEnabled) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
