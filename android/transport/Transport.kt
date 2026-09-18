package com.rescom.transport

import com.rescom.domain.model.Packet
import com.rescom.domain.model.Peer

interface Transport {
    val transportType: String

    suspend fun discover(): List<Peer>

    suspend fun connect(peer: Peer): Boolean

    suspend fun send(packet: Packet): Boolean

    suspend fun disconnect(peerId: String? = null)

    fun registerPacketListener(listener: (Packet, String?) -> Unit)
}
