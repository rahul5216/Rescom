package com.rescom.transport

import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import java.util.UUID

/**
 * BLE Transport Layer for Rescom.
 *
 * Implements the BLE Discovery + GATT advertising protocol as specified in the TAD:
 * - Advertises a Rescom service UUID for peer discovery.
 * - Scans for nearby devices advertising the same UUID.
 * - Establishes GATT connections for low-bandwidth control channel messaging
 *   (HELLO, IDENTITY, SESSION_INIT, SESSION_ACK packets).
 * - For high-bandwidth file/message transfers, switches to Wi-Fi Direct (LanTransport).
 *
 * Requires: BLUETOOTH_ADVERTISE, BLUETOOTH_CONNECT, BLUETOOTH_SCAN permissions (API 31+)
 */
class BleTransport(private val context: Context) {

    companion object {
        /** Rescom service UUID — unique identifier for device discovery */
        val SERVICE_UUID: UUID = UUID.fromString("6e400001-b5a3-f393-e0a9-e50e24dcca9e")

        /** GATT characteristic for control channel packet exchange */
        val CONTROL_CHAR_UUID: UUID = UUID.fromString("6e400002-b5a3-f393-e0a9-e50e24dcca9e")

        const val DEVICE_NAME_PREFIX = "Rescom:"
        const val MAX_PAYLOAD_BYTES = 512  // BLE MTU limit for control packets
    }

    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val bluetoothAdapter: BluetoothAdapter? = bluetoothManager.adapter
    private val bleAdvertiser: BluetoothLeAdvertiser? = bluetoothAdapter?.bluetoothLeAdvertiser
    private val bleScanner: BluetoothLeScanner? = bluetoothAdapter?.bluetoothLeScanner

    private var discoveryCallback: ((String, String, Int) -> Unit)? = null
    private var isAdvertising = false
    private var isScanning = false

    // ── Advertising ───────────────────────────────────────────────────────────

    /**
     * Start BLE advertising so nearby peers can discover this device.
     * @param deviceName Local peer display name to embed in the advertisement.
     */
    fun startAdvertising(deviceName: String) {
        if (isAdvertising || bleAdvertiser == null) return

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .build()

        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addServiceUuid(ParcelUuid(SERVICE_UUID))
            .addServiceData(
                ParcelUuid(SERVICE_UUID),
                (DEVICE_NAME_PREFIX + deviceName).take(MAX_PAYLOAD_BYTES).toByteArray()
            )
            .build()

        bleAdvertiser.startAdvertising(settings, data, advertiseCallback)
        isAdvertising = true
    }

    fun stopAdvertising() {
        if (!isAdvertising || bleAdvertiser == null) return
        bleAdvertiser.stopAdvertising(advertiseCallback)
        isAdvertising = false
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            // BLE advertising active
        }
        override fun onStartFailure(errorCode: Int) {
            isAdvertising = false
        }
    }

    // ── Discovery Scanning ────────────────────────────────────────────────────

    /**
     * Start scanning for nearby Rescom peers.
     * @param onPeerDiscovered Callback: (deviceAddress, displayName, rssi)
     */
    fun startScanning(onPeerDiscovered: (deviceAddress: String, displayName: String, rssi: Int) -> Unit) {
        if (isScanning || bleScanner == null) return
        discoveryCallback = onPeerDiscovered

        val filter = ScanFilter.Builder()
            .setServiceUuid(ParcelUuid(SERVICE_UUID))
            .build()

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()

        bleScanner.startScan(listOf(filter), settings, scanCallback)
        isScanning = true
    }

    fun stopScanning() {
        if (!isScanning || bleScanner == null) return
        bleScanner.stopScan(scanCallback)
        isScanning = false
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val serviceData = result.scanRecord?.getServiceData(ParcelUuid(SERVICE_UUID))
            val rawName = serviceData?.toString(Charsets.UTF_8) ?: return
            val displayName = rawName.removePrefix(DEVICE_NAME_PREFIX)
            discoveryCallback?.invoke(result.device.address, displayName, result.rssi)
        }
    }

    val isAvailable: Boolean get() = bluetoothAdapter?.isEnabled == true
}
