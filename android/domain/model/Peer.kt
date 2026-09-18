package com.rescom.domain.model

/**
 * Represents a discovered peer device in the Rescom mesh network.
 * Immutable value object following Clean Architecture principles.
 */
data class Peer(
    val peerId: String,
    val displayName: String,
    val department: String,
    val semester: String,
    val deviceId: String,
    val publicKey: String,           // PEM-encoded ECDSA public key for identity verification
    val lastSeen: Long,              // Unix epoch millis
    val connectionState: ConnectionState,
    val preferredTransport: TransportType,
    val rssi: Int = 0,               // Signal strength (BLE RSSI or Wi-Fi RSSI)
    val hopCount: Int = 1,           // 1 = direct, >1 = relayed
)

enum class ConnectionState {
    DIRECT,       // One-hop direct link (green clay)
    RELAY,        // Multi-hop relayed connection (purple clay)
    NEARBY,       // Discovered but not yet handshaked (blue clay)
    UNVERIFIED,   // Handshake pending identity verification (amber clay)
    DISCONNECTED  // Previously known, now offline (grey clay)
}

enum class TransportType {
    BLE,
    WIFI_DIRECT,
    LAN,
    HOTSPOT,
    UNKNOWN
}
