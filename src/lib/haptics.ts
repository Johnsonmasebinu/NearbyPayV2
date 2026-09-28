import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function fire(run: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  run().catch(() => undefined);
}

/** Light tap for ordinary buttons, chips and list rows. */
export function tap() {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Stronger tap for primary actions (FAB, submit, download). */
export function thud() {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Tab switches, segmented controls and toggles. */
export function select() {
  fire(() => Haptics.selectionAsync());
}

/** Something completed successfully (transfer done, receipt/QR saved). */
export function succeed() {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Something failed or was denied. */
export function fail() {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
