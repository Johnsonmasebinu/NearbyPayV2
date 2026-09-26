import { AppState } from 'react-native';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/auth-provider';
import { useUserProfile } from '@/hooks/user-profile-provider';
import {
  addNearbyBleDeviceListener,
  addNearbyBleStatusListener,
  isNearbyBleAvailable,
  requestNearbyBlePermissions,
  startNearbyAdvertising,
  startNearbyScanning,
  stopNearbyAdvertising,
  stopNearbyScanning,
  type NearbyBleDevice,
  type NearbyBleStatus,
} from '../../modules/nearby-ble/src';

export function useNearbyBluetooth() {
  const { user, hasContactlessCode } = useAuth();
  const { profile } = useUserProfile();
  const [devices, setDevices] = useState<NearbyBleDevice[]>([]);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<NearbyBleStatus | null>(null);
  const [bluetoothAvailable] = useState(isNearbyBleAvailable);

  useEffect(() => {
    if (!bluetoothAvailable) return;
    const deviceListener = addNearbyBleDeviceListener((device) => {
      setDevices((current) => {
        const withoutDuplicate = current.filter((item) => item.tag !== device.tag);
        return [...withoutDuplicate, device].sort((a, b) => b.rssi - a.rssi);
      });
    });
    const statusListener = addNearbyBleStatusListener((event) => {
      setStatus(event);
      if (event.role === 'advertising') setIsAdvertising(event.state === 'active');
      if (event.role === 'scanning') setIsScanning(event.state === 'active');
    });
    return () => {
      deviceListener.remove();
      statusListener.remove();
    };
  }, [bluetoothAvailable]);

  useEffect(() => {
    if (!bluetoothAvailable) return;
    const lifecycleListener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        void stopNearbyAdvertising().catch(() => undefined);
        setIsAdvertising(false);
      }
    });
    return () => lifecycleListener.remove();
  }, [bluetoothAvailable]);

  const enableAdvertising = async () => {
    if (!user || !hasContactlessCode) {
      throw new Error('Enable your 8-digit contactless code before using Nearby Discovery.');
    }
    if (!bluetoothAvailable) {
      throw new Error('Bluetooth discovery requires a NearbyPay development build.');
    }
    await requestNearbyBlePermissions();
    await startNearbyAdvertising(profile.tag.replace(/^[@$]/, '').toLowerCase(), profile.name);
  };

  const disableAdvertising = async () => {
    if (bluetoothAvailable) await stopNearbyAdvertising();
    setIsAdvertising(false);
  };

  const scanForReceivers = async () => {
    if (!bluetoothAvailable) {
      throw new Error('Bluetooth discovery requires a NearbyPay development build.');
    }
    await requestNearbyBlePermissions();
    setDevices([]);
    await startNearbyScanning();
  };

  const stopReceiverScan = async () => {
    if (bluetoothAvailable) await stopNearbyScanning();
    setIsScanning(false);
  };

  return {
    bluetoothAvailable,
    devices,
    isAdvertising,
    isScanning,
    status,
    enableAdvertising,
    disableAdvertising,
    scanForReceivers,
    stopReceiverScan,
  };
}