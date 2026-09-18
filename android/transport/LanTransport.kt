package com.rescom.transport

import android.content.Context
import android.net.wifi.p2p.*
import android.net.ConnectivityManager
import java.io.*
import java.net.*

/**
 * LAN / Wi-Fi Direct Transport Layer for Rescom.
 *
 * Handles high-bandwidth data transfer:
 * - Wi-Fi Direct P2P Group formation and peer connection.
 * - TCP socket server for incoming chunk streams.
 * - TCP socket client for outgoing MESSAGE, FILE_CHUNK, and large data packets.
 *
 * This transport is used for payloads exceeding BLE MTU (512 bytes),
 * primarily for file transfers (64KB chunks) and encrypted message payloads.
 *
 * Requires: ACCESS_FINE_LOCATION, CHANGE_WIFI_STATE, ACCESS_WIFI_STATE permissions.
 */
class LanTransport(private val context: Context) {

    companion object {
        const val SERVER_PORT = 8988    // Rescom TCP control port (matches TAD spec)
        const val BUFFER_SIZE = 65536   // 64KB — matches FileChunker chunk size
    }

    private val wifiP2pManager: WifiP2pManager =
        context.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
    private val wifiChannel: WifiP2pManager.Channel =
        wifiP2pManager.initialize(context, context.mainLooper, null)

    private var serverThread: Thread? = null
    private var onDataReceived: ((ByteArray, String) -> Unit)? = null

    // ── TCP Server (incoming connections) ─────────────────────────────────────

    /**
     * Start a TCP server socket to accept incoming data from peers.
     * Each accepted connection reads the full payload and invokes [onData].
     * @param onData Callback: (rawBytes, senderAddress)
     */
    fun startServer(onData: (rawBytes: ByteArray, senderAddress: String) -> Unit) {
        onDataReceived = onData
        serverThread = Thread {
            try {
                val serverSocket = ServerSocket(SERVER_PORT)
                while (!Thread.currentThread().isInterrupted) {
                    val socket = serverSocket.accept()
                    Thread {
                        try {
                            val input = DataInputStream(BufferedInputStream(socket.getInputStream()))
                            val length = input.readInt()
                            val buffer = ByteArray(length)
                            input.readFully(buffer)
                            onData(buffer, socket.inetAddress.hostAddress ?: "unknown")
                        } catch (e: IOException) {
                            // Connection closed
                        } finally {
                            socket.close()
                        }
                    }.start()
                }
            } catch (e: IOException) {
                // Server socket closed
            }
        }.also { it.isDaemon = true; it.start() }
    }

    /**
     * Send raw bytes to a peer over TCP.
     * Prefixes the payload with a 4-byte big-endian length header.
     * @param host Target IP address string.
     * @param data Raw bytes to send.
     */
    fun sendData(host: String, data: ByteArray): Boolean {
        return try {
            val socket = Socket()
            socket.connect(InetSocketAddress(host, SERVER_PORT), 5000)
            val output = DataOutputStream(BufferedOutputStream(socket.getOutputStream()))
            output.writeInt(data.size)
            output.write(data)
            output.flush()
            socket.close()
            true
        } catch (e: IOException) {
            false
        }
    }

    // ── Wi-Fi Direct Group Management ─────────────────────────────────────────

    /**
     * Discover Wi-Fi Direct peers in range.
     * @param listener WifiP2pManager.ActionListener for discovery result callbacks.
     */
    fun discoverPeers(listener: WifiP2pManager.ActionListener) {
        wifiP2pManager.discoverPeers(wifiChannel, listener)
    }

    /**
     * Request the current list of discovered Wi-Fi Direct peers.
     */
    fun requestPeerList(listener: WifiP2pManager.PeerListListener) {
        wifiP2pManager.requestPeers(wifiChannel, listener)
    }

    /**
     * Connect to a Wi-Fi Direct peer device.
     * @param device Target WifiP2pDevice (obtained from peer list).
     */
    fun connect(device: WifiP2pDevice, listener: WifiP2pManager.ActionListener) {
        val config = WifiP2pConfig().apply {
            deviceAddress = device.deviceAddress
            groupOwnerIntent = 0 // Prefer the peer to be group owner
        }
        wifiP2pManager.connect(wifiChannel, config, listener)
    }

    fun stopServer() {
        serverThread?.interrupt()
        serverThread = null
    }

    val isAvailable: Boolean
        get() {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            return cm.activeNetwork != null
        }
}
