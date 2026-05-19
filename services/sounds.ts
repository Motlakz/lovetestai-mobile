import { Platform } from 'react-native';

export type UiSound = 'next' | 'submit' | 'highScore' | 'mediumScore' | 'optionSelect' | 'messagePing';

const SOUND_SOURCES: Record<UiSound, number> = {
  next: require('@/assets/sounds/public_sounds_button_next.mp3'),
  submit: require('@/assets/sounds/public_sounds_button_submit.mp3'),
  highScore: require('@/assets/sounds/public_sounds_high_score.mp3'),
  mediumScore: require('@/assets/sounds/public_sounds_medium_score.mp3'),
  messagePing: require('@/assets/sounds/message_ping.mp3'),
  optionSelect: require('@/assets/sounds/public_sounds_option_select.mp3'),
};

const players = new Map<UiSound, any>();
let audioModule: any | null | undefined;

function getAudioModule() {
  if (audioModule !== undefined) return audioModule;
  try {
    audioModule = require('expo-audio');
    void audioModule.setAudioModeAsync?.({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
    });
  } catch {
    audioModule = null;
  }
  return audioModule;
}

function getPlayer(sound: UiSound) {
  const audio = getAudioModule();
  if (!audio) return null;
  const existing = players.get(sound);
  if (existing) return existing;
  const player = audio.createAudioPlayer(SOUND_SOURCES[sound], {
    keepAudioSessionActive: false,
  });
  players.set(sound, player);
  return player;
}

export async function playUiSound(sound: UiSound): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const player = getPlayer(sound);
    if (!player) return;
    await player.seekTo?.(0);
    player.play();
  } catch {
    // Sound effects are non-critical; haptics/toasts still provide feedback.
  }
}

export function playScoreSound(score?: number | null): void {
  if (typeof score === 'number' && score >= 80) {
    void playUiSound('highScore');
  } else {
    void playUiSound('mediumScore');
  }
}
