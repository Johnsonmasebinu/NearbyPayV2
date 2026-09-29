// expo-audio is required lazily so a build without the native module
// skips the sound instead of crashing every route.

let audioModeReady: Promise<void> | null = null;

/** Cash-register style chime for incoming money. Never throws. */
export async function playMoneyInSound() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createAudioPlayer, setAudioModeAsync } = require('expo-audio');
    if (!audioModeReady) {
      audioModeReady = setAudioModeAsync({ playsInSilentMode: true });
    }
    await audioModeReady;

    const player = createAudioPlayer(require('@/assets/sounds/money-in.wav'));
    const sub = player.addListener(
      'playbackStatusUpdate',
      (status: { didJustFinish?: boolean }) => {
        if (status.didJustFinish) {
          sub.remove();
          player.remove();
        }
      },
    );
    player.play();
  } catch {
    // Sound is garnish. A failure must never break the app.
  }
}