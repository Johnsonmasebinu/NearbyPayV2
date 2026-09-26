import { NativeModule, requireOptionalNativeModule } from 'expo';
import { PermissionsAndroid, Platform } from 'react-native';

export type NearbyBleDevice = {
  id: string;
  tag: string;
  name: string;
  rssi: number;
};

export type NearbyBleStatus = {
  role: 'advertising' | 'scanning';
  state: string;
  message?: string;
};

type NearbyBleEvents = {
  onNearbyDeviceFound: (event: NearbyBleDevice) => void;
  onNearbyBleStatus: (event: NearbyBleStatus) => void;
};

declare class NearbyBleNativeModule extends NativeModule<NearbyBleEvents> {
  startAdvertising: (payload: string) => Promise<void>;
  stopAdvertising: () => Promise<void>;
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
}

const nativeModule = requireOptionalNativeModule<NearbyBleNativeModule>('NearbyBle');

export function isNearbyBleAvailable(): boolean {
  return Platform.OS !== 'web' && nativeModule !== null;
}

function requireNearbyBle(): NearbyBleNativeModule {
  if (!nativeModule) {
    throw new Error('Bluetooth discovery requires a NearbyPay development build.');
  }
  return nativeModule;
}

export async function requestNearbyBlePermissions(): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Bluetooth discovery is available in the iOS and Android apps.');
  }

  if (Platform.OS !== 'android') return;

  const permissions = Number(Platform.Version) >= 31
    ? [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const results = await PermissionsAndroid.requestMultiple(permissions);

  if (Object.values(results).some((result) => result !== PermissionsAndroid.RESULTS.GRANTED)) {
    throw new Error('NearbyPay needs Bluetooth permission to find nearby receivers.');
  }
}

export function startNearbyAdvertising(tag: string, name: string) {
  const payload = JSON.stringify({ v: 1, tag, name });
  return requireNearbyBle().startAdvertising(payload);
}

export function stopNearbyAdvertising() {
  return requireNearbyBle().stopAdvertising();
}

export function startNearbyScanning() {
  return requireNearbyBle().startScanning();
}

export function stopNearbyScanning() {
  return requireNearbyBle().stopScanning();
}

export function addNearbyBleDeviceListener(listener: (device: NearbyBleDevice) => void) {
  return requireNearbyBle().addListener('onNearbyDeviceFound', listener);
}

export function addNearbyBleStatusListener(
  listener: (event: NearbyBleStatus) => void,
) {
  return requireNearbyBle().addListener('onNearbyBleStatus', listener);
}