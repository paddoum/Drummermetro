# 🥁 Drummermetro

A mobile metronome app built for drummers — visual flash screen, playlist management, and haptic feedback.

**Live demo → [paddoum.github.io/Drummermetro](https://paddoum.github.io/Drummermetro/)**

---

## Features

- **Full-screen flash** — the screen flashes white on every beat, red on the downbeat (beat 1)
- **Playlist** — manage multiple tracks, each with its own BPM, time signature, and bar count
- **Bar counter** — always know where you are in the song (e.g. *Mesure 3 / 16*)
- **Beat dots** — visual indicator of the current beat within the bar
- **Audio click** — accent on beat 1, regular click on other beats (can be muted)
- **Haptic feedback** — heavy pulse on beat 1, light on other beats
- **Manual track advance** — the metronome stops at the end of the bars; you press "Suivant" when ready
- **Persistent playlist** — changes are saved to local storage and restored on next launch

---

## Stack

- [Expo](https://expo.dev) (SDK 56) / React Native
- `expo-audio` for click sounds
- `expo-haptics` for vibration feedback
- `@react-native-async-storage/async-storage` for playlist persistence
- Deployable as a static web app via GitHub Pages

---

## Run locally

```bash
# Install dependencies
npm install

# Start on iOS simulator
npx expo start --ios

# Start in browser
npx expo start --web
```

---

## Project structure

```
src/
  hooks/
    useMetronome.js       # Core metronome logic (interval, beat/bar counting, audio, haptics)
  screens/
    MetronomeScreen.js    # Main flash screen UI
    PlaylistScreen.js     # Playlist manager (add / edit / delete tracks)
  store/
    playlistStore.js      # AsyncStorage load/save helpers + default playlist
assets/
  click.wav               # Regular beat click sound
  accent.wav              # Downbeat accent sound
```

---

## Playlist data model

Each track stores:

| Field | Type | Description |
|---|---|---|
| `name` | string | Track name |
| `bpm` | number | Tempo (20–300) |
| `timeSignature` | number | Beats per bar (2, 3, 4, 5, 6, 7) |
| `bars` | number | Number of bars (0 = infinite) |
