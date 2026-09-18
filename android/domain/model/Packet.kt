package com.rescom.domain.model

enum class PacketType {
    HELLO,
    IDENTITY,
    SESSION_INIT,
    SESSION_ACK,
    MESSAGE,
    MESSAGE_ACK,
    FILE_OFFER,
    FILE_CHUNK,
    FILE_ACK,
    ROUTE_DISCOVERY,
    ROUTE_UPDATE,
    EMERGENCY_BROADCAST,
    ERROR
}

data class Packet(
    val packetId: String,
    val sourceId: String,
    val destinationId: String?,
    val type: PacketType,
    val ttl: Int = 5,
    val sequence: Long,
    val timestamp: Long = System.currentTimeMillis(),
    val payload: ByteArray,
    val signature: String? = null,
    val routeTrace: List<String> = emptyList()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Packet
        return packetId == other.packetId
    }

    override fun hashCode(): Int {
        return packetId.hashCode()
    }
}
