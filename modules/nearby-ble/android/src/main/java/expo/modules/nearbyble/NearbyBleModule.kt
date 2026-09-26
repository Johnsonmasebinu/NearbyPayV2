package expo.modules.nearbyble

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.Build
import android.os.ParcelUuid
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONObject
import java.util.UUID

private val nearbyServiceUuid = UUID.fromString("C5A37AB3-70D3-4F93-9B09-2AEE756E3221")
private val nearbyCharacteristicUuid = UUID.fromString("D4AF35B1-E0C8-46CE-8F20-1B2D90301843")

class NearbyBleModule : Module() {
  private var controller: NearbyBleController? = null

  override fun definition() = ModuleDefinition {
    Name("NearbyBle")
    Events("onNearbyDeviceFound", "onNearbyBleStatus")

    OnCreate {
      val context = requireNotNull(appContext.reactContext) { "React context is unavailable." }
      controller = NearbyBleController(context) { event, payload -> sendEvent(event, payload) }
    }

    OnDestroy {
      controller?.stopScanning()
      controller?.stopAdvertising()
      controller = null
    }

    AsyncFunction("startAdvertising") { payload: String ->
      requireController().startAdvertising(payload)
    }

    AsyncFunction("stopAdvertising") {
      controller?.stopAdvertising()
    }

    AsyncFunction("startScanning") {
      requireController().startScanning()
    }

    AsyncFunction("stopScanning") {
      controller?.stopScanning()
    }
  }

  private fun requireController(): NearbyBleController =
    controller ?: throw IllegalStateException("Bluetooth is not initialized.")
}

private class NearbyBleController(
  private val context: Context,
  private val emit: (String, Map<String, Any?>) -> Unit,
) {
  private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
  private val adapter: BluetoothAdapter? = bluetoothManager.adapter

  private var advertiser: BluetoothLeAdvertiser? = null
  private var scanner: BluetoothLeScanner? = null
  private var gattServer: BluetoothGattServer? = null
  private var receiverPayload: ByteArray? = null
  private var receiverCharacteristic: BluetoothGattCharacteristic? = null
  private var advertiseRequested = false
  private var scanRequested = false
  private val discoveredAddresses = mutableSetOf<String>()
  private val activeGattConnections = mutableMapOf<String, BluetoothGatt>()

  fun startAdvertising(payload: String) {
    if (payload.toByteArray(Charsets.UTF_8).size > 512) {
      throw IllegalArgumentException("NearbyPay receiver details are too large to advertise.")
    }
    ensureBluetoothEnabled()
    advertiseRequested = true
    receiverPayload = payload.toByteArray(Charsets.UTF_8)
    advertiser = requireAdapter().bluetoothLeAdvertiser
      ?: throw IllegalStateException("Bluetooth LE advertising is unavailable on this device.")

    stopGattServer()
    val service = BluetoothGattService(nearbyServiceUuid, BluetoothGattService.SERVICE_TYPE_PRIMARY)
    val characteristic = BluetoothGattCharacteristic(
      nearbyCharacteristicUuid,
      BluetoothGattCharacteristic.PROPERTY_READ,
      BluetoothGattCharacteristic.PERMISSION_READ,
    )
    characteristic.value = receiverPayload
    service.addCharacteristic(characteristic)
    receiverCharacteristic = characteristic
    gattServer = bluetoothManager.openGattServer(context, gattServerCallback)
      ?: throw IllegalStateException("Could not open the nearby receiver service.")
    if (!gattServer!!.addService(service)) {
      stopGattServer()
      throw IllegalStateException("Could not publish the nearby receiver service.")
    }
  }

  fun stopAdvertising() {
    advertiseRequested = false
    try {
      advertiser?.stopAdvertising(advertiseCallback)
    } catch (_: SecurityException) {
      // Bluetooth permission may have been revoked while the app was open.
    }
    stopGattServer()
    receiverPayload = null
    receiverCharacteristic = null
    emit("onNearbyBleStatus", mapOf("role" to "advertising", "state" to "stopped"))
  }

  fun startScanning() {
    ensureBluetoothEnabled()
    scanner = requireAdapter().bluetoothLeScanner
      ?: throw IllegalStateException("Bluetooth LE scanning is unavailable on this device.")
    discoveredAddresses.clear()
    scanRequested = true
    val filter = ScanFilter.Builder().setServiceUuid(ParcelUuid(nearbyServiceUuid)).build()
    val settings = ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build()
    scanner?.startScan(listOf(filter), settings, scanCallback)
    emit("onNearbyBleStatus", mapOf("role" to "scanning", "state" to "active"))
  }

  fun stopScanning() {
    scanRequested = false
    try {
      scanner?.stopScan(scanCallback)
    } catch (_: SecurityException) {
      // Bluetooth permission may have been revoked while the app was open.
    }
    activeGattConnections.values.forEach { gatt ->
      try {
        gatt.disconnect()
        gatt.close()
      } catch (_: SecurityException) {
        // Ignore disconnect failures during cleanup.
      }
    }
    activeGattConnections.clear()
    emit("onNearbyBleStatus", mapOf("role" to "scanning", "state" to "stopped"))
  }

  private fun ensureBluetoothEnabled() {
    if (!requireAdapter().isEnabled) throw IllegalStateException("Turn on Bluetooth to use Nearby Discovery.")
  }

  private fun requireAdapter(): BluetoothAdapter =
    adapter ?: throw IllegalStateException("This device does not support Bluetooth LE.")

  private fun stopGattServer() {
    try {
      gattServer?.clearServices()
      gattServer?.close()
    } catch (_: SecurityException) {
      // Ignore shutdown failures during cleanup.
    }
    gattServer = null
  }

  private fun startAdvertisingGattService() {
    if (!advertiseRequested) return
    val advertiseData = AdvertiseData.Builder()
      .addServiceUuid(ParcelUuid(nearbyServiceUuid))
      .setIncludeDeviceName(false)
      .build()
    val settings = AdvertiseSettings.Builder()
      .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
      .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
      .setConnectable(true)
      .setTimeout(0)
      .build()
    advertiser?.startAdvertising(settings, advertiseData, advertiseCallback)
  }

  private val advertiseCallback = object : AdvertiseCallback() {
    override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
      emit("onNearbyBleStatus", mapOf("role" to "advertising", "state" to "active"))
    }

    override fun onStartFailure(errorCode: Int) {
      emit("onNearbyBleStatus", mapOf(
        "role" to "advertising",
        "state" to "error",
        "message" to "Bluetooth advertising failed ($errorCode).",
      ))
    }
  }

  private val gattServerCallback = object : BluetoothGattServerCallback() {
    override fun onServiceAdded(status: Int, service: BluetoothGattService) {
      if (status == BluetoothGatt.GATT_SUCCESS) {
        startAdvertisingGattService()
      } else {
        emit("onNearbyBleStatus", mapOf(
          "role" to "advertising",
          "state" to "error",
          "message" to "Could not publish NearbyPay's Bluetooth service ($status).",
        ))
      }
    }

    override fun onCharacteristicReadRequest(
      device: BluetoothDevice,
      requestId: Int,
      offset: Int,
      characteristic: BluetoothGattCharacteristic,
    ) {
      val value = receiverPayload
      if (characteristic.uuid != nearbyCharacteristicUuid || value == null || offset > value.size) {
        gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_INVALID_OFFSET, offset, null)
        return
      }
      gattServer?.sendResponse(
        device,
        requestId,
        BluetoothGatt.GATT_SUCCESS,
        offset,
        value.copyOfRange(offset, value.size),
      )
    }
  }

  private val scanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
      val device = result.device
      val address = device.address ?: return
      if (!scanRequested || !discoveredAddresses.add(address)) return
      try {
        val gatt = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          device.connectGatt(context, false, clientGattCallback, BluetoothDevice.TRANSPORT_LE)
        } else {
          device.connectGatt(context, false, clientGattCallback)
        }
        activeGattConnections[address] = gatt
      } catch (error: SecurityException) {
        discoveredAddresses.remove(address)
        emit("onNearbyBleStatus", mapOf(
          "role" to "scanning",
          "state" to "error",
          "message" to (error.message ?: "Bluetooth permission was denied."),
        ))
      }
    }

    override fun onScanFailed(errorCode: Int) {
      emit("onNearbyBleStatus", mapOf(
        "role" to "scanning",
        "state" to "error",
        "message" to "Bluetooth scan failed ($errorCode).",
      ))
    }
  }

  private val clientGattCallback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
      if (status == BluetoothGatt.GATT_SUCCESS && newState == BluetoothProfile.STATE_CONNECTED) {
        gatt.discoverServices()
      } else {
        closeGatt(gatt)
      }
    }

    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
      val characteristic = gatt.getService(nearbyServiceUuid)
        ?.getCharacteristic(nearbyCharacteristicUuid)
      if (status == BluetoothGatt.GATT_SUCCESS && characteristic != null) {
        gatt.readCharacteristic(characteristic)
      } else {
        closeGatt(gatt)
      }
    }

    @Deprecated("Used on Android versions before API 33")
    override fun onCharacteristicRead(
      gatt: BluetoothGatt,
      characteristic: BluetoothGattCharacteristic,
      status: Int,
    ) {
      if (status == BluetoothGatt.GATT_SUCCESS) {
        deliverDevice(gatt, characteristic.value)
      } else {
        closeGatt(gatt)
      }
    }

    override fun onCharacteristicRead(
      gatt: BluetoothGatt,
      characteristic: BluetoothGattCharacteristic,
      value: ByteArray,
      status: Int,
    ) {
      if (status == BluetoothGatt.GATT_SUCCESS) {
        deliverDevice(gatt, value)
      } else {
        closeGatt(gatt)
      }
    }
  }

  private fun deliverDevice(gatt: BluetoothGatt, bytes: ByteArray?) {
    val payload = bytes?.toString(Charsets.UTF_8)
    try {
      val json = JSONObject(payload ?: return)
      val tag = json.optString("tag")
      if (!tag.matches(Regex("^[a-z0-9_]{1,30}$"))) return
      emit("onNearbyDeviceFound", mapOf(
        "id" to gatt.device.address,
        "tag" to tag,
        "name" to json.optString("name", "NearbyPay receiver"),
        "rssi" to -100,
      ))
    } catch (_: Exception) {
      // Ignore devices that advertise our service UUID but return invalid data.
    } finally {
      closeGatt(gatt)
    }
  }

  private fun closeGatt(gatt: BluetoothGatt) {
    val address = try {
      gatt.device.address
    } catch (_: SecurityException) {
      ""
    }
    activeGattConnections.remove(address)
    try {
      gatt.disconnect()
      gatt.close()
    } catch (_: SecurityException) {
      // Ignore disconnect failures after reading the public receiver tag.
    }
  }
}