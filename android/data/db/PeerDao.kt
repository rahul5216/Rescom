package com.rescom.data.db

import androidx.room.*
import com.rescom.domain.model.Peer
import com.rescom.domain.model.ConnectionState
import com.rescom.domain.model.TransportType
import kotlinx.coroutines.flow.Flow

// ─── Room Entity ─────────────────────────────────────────────────────────────

@Entity(
    tableName = "peers",
    indices = [
        Index("connectionState"),
        Index("deviceId", unique = true),
        Index("lastSeen"),
    ]
)
data class PeerEntity(
    @PrimaryKey val peerId: String,
    val displayName: String,
    val department: String,
    val semester: String,
    val deviceId: String,
    val publicKey: String,
    val lastSeen: Long,
    val connectionState: String,      // ConnectionState enum name
    val preferredTransport: String,   // TransportType enum name
    val rssi: Int,
    val hopCount: Int,
)

// ─── DAO ─────────────────────────────────────────────────────────────────────

@Dao
interface PeerDao {
    @Query("SELECT * FROM peers ORDER BY lastSeen DESC")
    fun observeAll(): Flow<List<PeerEntity>>

    @Query("SELECT * FROM peers WHERE connectionState NOT IN ('DISCONNECTED') ORDER BY lastSeen DESC")
    suspend fun getConnected(): List<PeerEntity>

    @Query("SELECT * FROM peers WHERE peerId = :id LIMIT 1")
    suspend fun getById(id: String): PeerEntity?

    @Query("SELECT * FROM peers WHERE deviceId = :deviceId LIMIT 1")
    suspend fun getByDeviceId(deviceId: String): PeerEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPeer(peer: PeerEntity)

    @Query("UPDATE peers SET connectionState = :state WHERE peerId = :id")
    suspend fun updateState(id: String, state: String)

    @Query("UPDATE peers SET lastSeen = :ts WHERE peerId = :id")
    suspend fun updateLastSeen(id: String, ts: Long)

    @Query("DELETE FROM peers WHERE lastSeen < :before")
    suspend fun evictStale(before: Long)
}

// ─── Mapper extensions ────────────────────────────────────────────────────────

fun PeerEntity.toDomain(): Peer = Peer(
    peerId = peerId,
    displayName = displayName,
    department = department,
    semester = semester,
    deviceId = deviceId,
    publicKey = publicKey,
    lastSeen = lastSeen,
    connectionState = ConnectionState.valueOf(connectionState),
    preferredTransport = TransportType.valueOf(preferredTransport),
    rssi = rssi,
    hopCount = hopCount,
)

fun Peer.toEntity(): PeerEntity = PeerEntity(
    peerId = peerId,
    displayName = displayName,
    department = department,
    semester = semester,
    deviceId = deviceId,
    publicKey = publicKey,
    lastSeen = lastSeen,
    connectionState = connectionState.name,
    preferredTransport = preferredTransport.name,
    rssi = rssi,
    hopCount = hopCount,
)
