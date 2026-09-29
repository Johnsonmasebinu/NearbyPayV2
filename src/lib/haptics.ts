import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function fire(label: string, run: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  run().catch((error) => {
    // Never crash the app over a vibration — but say so in dev logs
    // so a missing/broken native module is visible instead of silent.
    if (__DEV__) console.warn(`[haptics] ${label} failed:`, error);
  });
}

/** Light tap for ordinary buttons, chips and list rows. */
export function tap() {
  fire('tap', () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Stronger tap for primary actions (FAB, submit, download). */
export function thud() {
  fire('thud', () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Tab switches, segmented controls and toggles. */
export function select() {
  fire('select', () => Haptics.selectionAsync());
}

/** Something completed successfully (transfer done, receipt/QR saved). */
export function succeed() {
  fire('succeed', () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Something failed or was denied. */
export function fail() {
  fire('fail', () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
