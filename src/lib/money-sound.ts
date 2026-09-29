// NOTE: expo-av is required lazily inside playMoneyInSound rather than
// imported at the top of this file. An eager import throws at module load
// on builds without the native audio module (Expo Go / stale dev builds),
// which takes down every route that pulls in the notifications provider.
// Lazily requiring it keeps the app running and just skips the sound.
import type { AVPlaybackStatus } from 'expo-av';

let audioModeReady: Promise<void> | null = null;

/** Cash-register style chime for incoming money. Never throws. */
export async function playMoneyInSound() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Audio } = require('expo-av');
    if (!audioModeReady) {
      audioModeReady = Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    }
    await audioModeReady;
    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/sounds/money-in.wav'),
    );
    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync().catch(() => undefined);
      }
    });
    await sound.playAsync();
  } catch {
    // Sound is garnish — a failure must never break the app.
  }
}
