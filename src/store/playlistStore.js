import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@metronome_playlist';

export const DEFAULT_PLAYLIST = [
  { id: '1', name: 'Warm Up', bpm: 80, timeSignature: 4, bars: 8 },
  { id: '2', name: 'Main Groove', bpm: 120, timeSignature: 4, bars: 16 },
  { id: '3', name: 'Bridge', bpm: 95, timeSignature: 3, bars: 12 },
  { id: '4', name: 'Final Push', bpm: 140, timeSignature: 4, bars: 8 },
];

export async function loadPlaylist() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PLAYLIST;
  } catch {
    return DEFAULT_PLAYLIST;
  }
}

export async function savePlaylist(playlist) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(playlist));
  } catch {}
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
