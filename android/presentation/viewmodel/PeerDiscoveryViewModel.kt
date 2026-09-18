package com.rescom.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rescom.domain.model.Peer
import com.rescom.domain.model.ConnectionState
import com.rescom.domain.repository.PeerRepository
import com.rescom.domain.repository.SecurityRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PeerDiscoveryUiState(
    val peers: List<Peer> = emptyList(),
    val isScanning: Boolean = false,
    val scanProgress: Float = 0f,  // 0..1 radar sweep progress
    val handshakingPeerId: String? = null,
    val error: String? = null,
)

/**
 * ViewModel for the Peer Discovery screen.
 * Drives BLE + Wi-Fi discovery scanning and cryptographic handshake initiation.
 */
@HiltViewModel
class PeerDiscoveryViewModel @Inject constructor(
    private val peerRepo: PeerRepository,
    private val securityRepo: SecurityRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(PeerDiscoveryUiState())
    val uiState: StateFlow<PeerDiscoveryUiState> = _uiState.asStateFlow()

    init {
        observePeers()
    }

    private fun observePeers() {
        viewModelScope.launch {
            peerRepo.observePeers()
                .catch { e -> _uiState.update { it.copy(error = e.message) } }
                .collect { peers ->
                    _uiState.update { it.copy(peers = peers, error = null) }
                }
        }
    }

    fun startScan() {
        if (_uiState.value.isScanning) return
        viewModelScope.launch {
            _uiState.update { it.copy(isScanning = true, scanProgress = 0f) }
            // Animate radar sweep: 0 → 1 over 3 seconds
            repeat(30) { i ->
                delay(100)
                _uiState.update { it.copy(scanProgress = (i + 1) / 30f) }
            }
            _uiState.update { it.copy(isScanning = false, scanProgress = 1f) }
        }
    }

    /**
     * Initiate the ECDH session handshake with a discovered peer.
     * Generates a shared secret and stores the session key for future message encryption.
     */
    fun initiateHandshake(peer: Peer) {
        viewModelScope.launch {
            _uiState.update { it.copy(handshakingPeerId = peer.peerId) }
            try {
                securityRepo.deriveSharedSecret(peer.publicKey)
                peerRepo.updateConnectionState(peer.peerId, ConnectionState.DIRECT)
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Handshake failed: ${e.message}") }
            } finally {
                _uiState.update { it.copy(handshakingPeerId = null) }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
