import CoreBluetooth
import ExpoModulesCore
import Foundation

public class NearbyBleModule: Module {
  private var controller: NearbyBleController?

  public func definition() -> ModuleDefinition {
    Name("NearbyBle")
    Events("onNearbyDeviceFound", "onNearbyBleStatus")

    OnCreate {
      controller = NearbyBleController { [weak self] event, payload in
        self?.sendEvent(event, payload)
      }
    }

    OnDestroy {
      controller?.stopScanning()
      controller?.stopAdvertising()
      controller = nil
    }

    AsyncFunction("startAdvertising") { (payload: String) in
      guard let controller else { throw NearbyBleException("Bluetooth is not ready.") }
      try controller.startAdvertising(payload: payload)
    }.runOnQueue(.main)

    AsyncFunction("stopAdvertising") {
      controller?.stopAdvertising()
    }.runOnQueue(.main)

    AsyncFunction("startScanning") {
      guard let controller else { throw NearbyBleException("Bluetooth is not ready.") }
      try controller.startScanning()
    }.runOnQueue(.main)

    AsyncFunction("stopScanning") {
      controller?.stopScanning()
    }.runOnQueue(.main)
  }
}

private struct NearbyBleException: Error, CustomStringConvertible {
  let description: String

  init(_ description: String) {
    self.description = description
  }
}

private final class NearbyBleController: NSObject,
  CBCentralManagerDelegate,
  CBPeripheralDelegate,
  CBPeripheralManagerDelegate
{
  private static let serviceUUID = CBUUID(string: "C5A37AB3-70D3-4F93-9B09-2AEE756E3221")
  private static let characteristicUUID = CBUUID(string: "D4AF35B1-E0C8-46CE-8F20-1B2D90301843")

  private let emit: (String, [String: Any]) -> Void
  private var centralManager: CBCentralManager?
  private var peripheralManager: CBPeripheralManager?
  private var localCharacteristic: CBMutableCharacteristic?
  private var receivePayload: Data?
  private var shouldAdvertise = false
  private var shouldScan = false
  private var discoveredPeripherals: [UUID: CBPeripheral] = [:]
  private var peripheralRSSI: [UUID: Int] = [:]
  private var connectingIDs = Set<UUID>()
  private var deliveredIDs = Set<UUID>()

  init(emit: @escaping (String, [String: Any]) -> Void) {
    self.emit = emit
    super.init()
  }

  func startAdvertising(payload: String) throws {
    guard let data = payload.data(using: .utf8), data.count <= 512 else {
      throw NearbyBleException("NearbyPay receiver details are too large to advertise.")
    }
    receivePayload = data
    shouldAdvertise = true
    ensurePeripheralManager()
    guard peripheralManager?.state == .poweredOn else {
      emitStatus(role: "advertising", state: "waiting", message: "Turn on Bluetooth to advertise this receiver.")
      return
    }
    publishReceiverService()
  }

  func stopAdvertising() {
    shouldAdvertise = false
    peripheralManager?.stopAdvertising()
    peripheralManager?.removeAllServices()
    localCharacteristic = nil
    receivePayload = nil
    emitStatus(role: "advertising", state: "stopped")
  }

  func startScanning() throws {
    shouldScan = true
    deliveredIDs.removeAll()
    ensureCentralManager()
    guard centralManager?.state == .poweredOn else {
      emitStatus(role: "scanning", state: "waiting", message: "Turn on Bluetooth to find nearby receivers.")
      return
    }
    beginScan()
  }

  func stopScanning() {
    shouldScan = false
    centralManager?.stopScan()
    for peripheral in discoveredPeripherals.values where peripheral.state != .disconnected {
      centralManager?.cancelPeripheralConnection(peripheral)
    }
    discoveredPeripherals.removeAll()
    peripheralRSSI.removeAll()
    connectingIDs.removeAll()
    emitStatus(role: "scanning", state: "stopped")
  }

  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    let state = stateName(central.state)
    emitStatus(role: "scanning", state: state)
    if central.state == .poweredOn && shouldScan {
      beginScan()
    }
  }

  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    let state = stateName(peripheral.state)
    emitStatus(role: "advertising", state: state)
    if peripheral.state == .poweredOn && shouldAdvertise {
      publishReceiverService()
    }
  }

  func centralManager(
    _ central: CBCentralManager,
    didDiscover peripheral: CBPeripheral,
    advertisementData: [String: Any],
    rssi RSSI: NSNumber
  ) {
    let identifier = peripheral.identifier
    guard !deliveredIDs.contains(identifier), !connectingIDs.contains(identifier) else { return }
    discoveredPeripherals[identifier] = peripheral
    peripheralRSSI[identifier] = RSSI.intValue
    connectingIDs.insert(identifier)
    central.connect(peripheral, options: nil)
  }

  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    peripheral.delegate = self
    peripheral.discoverServices([Self.serviceUUID])
  }

  func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
    connectingIDs.remove(peripheral.identifier)
    discoveredPeripherals.removeValue(forKey: peripheral.identifier)
  }

  func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
    connectingIDs.remove(peripheral.identifier)
    discoveredPeripherals.removeValue(forKey: peripheral.identifier)
  }

  func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
    guard error == nil,
      let service = peripheral.services?.first(where: { $0.uuid == Self.serviceUUID }) else {
      disconnect(peripheral)
      return
    }
    peripheral.discoverCharacteristics([Self.characteristicUUID], for: service)
  }

  func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
    guard error == nil,
      let characteristic = service.characteristics?.first(where: { $0.uuid == Self.characteristicUUID }) else {
      disconnect(peripheral)
      return
    }
    peripheral.readValue(for: characteristic)
  }

  func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
    defer { disconnect(peripheral) }
    guard error == nil,
      characteristic.uuid == Self.characteristicUUID,
      let value = characteristic.value,
      let details = try? JSONSerialization.jsonObject(with: value) as? [String: Any],
      let tag = details["tag"] as? String,
      tag.range(of: "^[a-z0-9_]{1,30}$", options: .regularExpression) != nil else {
      return
    }

    let identifier = peripheral.identifier
    guard deliveredIDs.insert(identifier).inserted else { return }
    emit("onNearbyDeviceFound", [
      "id": identifier.uuidString,
      "tag": tag,
      "name": details["name"] as? String ?? "NearbyPay receiver",
      "rssi": peripheralRSSI[identifier] ?? -100
    ])
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, didAdd service: CBService, error: Error?) {
    guard shouldAdvertise else { return }
    if let error {
      emitStatus(role: "advertising", state: "error", message: error.localizedDescription)
      return
    }
    peripheral.startAdvertising([
      CBAdvertisementDataServiceUUIDsKey: [Self.serviceUUID]
    ])
  }

  func peripheralManagerDidStartAdvertising(_ peripheral: CBPeripheralManager, error: Error?) {
    if let error {
      emitStatus(role: "advertising", state: "error", message: error.localizedDescription)
    } else {
      emitStatus(role: "advertising", state: "active")
    }
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveRead request: CBATTRequest) {
    guard request.characteristic.uuid == Self.characteristicUUID,
      let payload = receivePayload,
      request.offset <= payload.count else {
      peripheral.respond(to: request, withResult: .invalidOffset)
      return
    }
    request.value = payload.subdata(in: request.offset..<payload.count)
    peripheral.respond(to: request, withResult: .success)
  }

  private func publishReceiverService() {
    guard shouldAdvertise, receivePayload != nil, let peripheralManager else { return }
    peripheralManager.stopAdvertising()
    peripheralManager.removeAllServices()
    let characteristic = CBMutableCharacteristic(
      type: Self.characteristicUUID,
      properties: [.read],
      value: nil,
      permissions: [.readable]
    )
    let service = CBMutableService(type: Self.serviceUUID, primary: true)
    service.characteristics = [characteristic]
    localCharacteristic = characteristic
    peripheralManager.add(service)
  }

  private func beginScan() {
    guard shouldScan, let centralManager, centralManager.state == .poweredOn else { return }
    centralManager.scanForPeripherals(withServices: [Self.serviceUUID], options: [
      CBCentralManagerScanOptionAllowDuplicatesKey: false
    ])
    emitStatus(role: "scanning", state: "active")
  }

  private func disconnect(_ peripheral: CBPeripheral) {
    centralManager?.cancelPeripheralConnection(peripheral)
    connectingIDs.remove(peripheral.identifier)
    discoveredPeripherals.removeValue(forKey: peripheral.identifier)
  }

  private func emitStatus(role: String, state: String, message: String? = nil) {
    var payload: [String: Any] = ["role": role, "state": state]
    if let message { payload["message"] = message }
    emit("onNearbyBleStatus", payload)
  }

  private func ensureCentralManager() {
    guard centralManager == nil else { return }
    centralManager = CBCentralManager(delegate: self, queue: .main)
  }

  private func ensurePeripheralManager() {
    guard peripheralManager == nil else { return }
    peripheralManager = CBPeripheralManager(delegate: self, queue: .main)
  }

  private func stateName(_ state: CBManagerState) -> String {
    switch state {
    case .poweredOn: return "poweredOn"
    case .poweredOff: return "poweredOff"
    case .unauthorized: return "unauthorized"
    case .unsupported: return "unsupported"
    case .resetting: return "resetting"
    case .unknown: return "unknown"
    @unknown default: return "unknown"
    }
  }
}