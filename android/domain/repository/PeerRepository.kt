package com.rescom.domain.repository

import com.rescom.domain.model.Peer
import com.rescom.domain.model.ConnectionState
import kotlinx.coroutines.flow.Flow

/**
 * Peer Repository contract — tracks discovered Rescom mesh peers.
 * Backed by Room for persistence and a BLE/Wi-Fi scanner for discovery.
 */
interface PeerRepository {
    /**
     * Observe all known peers as a reactive Flow.
     * Emits updates whenever peer states change (connected, disconnected, etc).
     */
    fun observePeers(): Flow<List<Peer>>

    /** Insert or update a peer record from a received IDENTITY packet. */
    suspend fun savePeer(peer: Peer)

    /** Update the connection state of a known peer. */
    suspend fun updateConnectionState(peerId: String, state: ConnectionState)

    /** Touch last-seen timestamp for keepalive tracking. */
    suspend fun updateLastSeen(peerId: String, timestampMs: Long)

    /** Get all peers currently in an active connected state. */
    suspend fun getConnectedPeers(): List<Peer>

    /** Look up a single peer by their unique peer ID. */
    suspend fun getPeerById(peerId: String): Peer?

    /** Look up a peer by their device ID (hardware fingerprint). */
    suspend fun getPeerByDeviceId(deviceId: String): Peer?

    /** Remove peers that haven't been seen in the past [thresholdMs] milliseconds. */
    suspend fun evictStalePeers(thresholdMs: Long = 30 * 60 * 1000L)
}
