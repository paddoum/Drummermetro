import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

function vibrate(isDownbeat) {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isDownbeat ? 60 : 30);
    }
  } else {
    Haptics.impactAsync(
      isDownbeat ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});
  }
}

export function useMetronome({ bpm, timeSignature, bars, onFinished, soundEnabled, hapticsEnabled }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);
  const [flash, setFlash] = useState(false);
  const [isDownbeat, setIsDownbeat] = useState(false);

  const timerRef       = useRef(null);
  const beatRef        = useRef(0);
  const barRef         = useRef(0);
  const expectedRef    = useRef(0);
  const isPlayingRef   = useRef(false);
  const clickSoundRef  = useRef(null);
  const accentSoundRef = useRef(null);
  const soundsReady    = useRef(false);

  const bpmRef        = useRef(bpm);            bpmRef.current = bpm;
  const timeSigRef    = useRef(timeSignature);  timeSigRef.current = timeSignature;
  const barsRef       = useRef(bars);           barsRef.current = bars;
  const soundRef      = useRef(soundEnabled);   soundRef.current = soundEnabled;
  const hapticsRef    = useRef(hapticsEnabled); hapticsRef.current = hapticsEnabled;
  const onFinishedRef = useRef(onFinished);     onFinishedRef.current = onFinished;

  // Load sounds once on mount
  useEffect(() => {
    let mounted = true;
    async function loadSounds() {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      const { sound: click } = await Audio.Sound.createAsync(
        require('../../assets/click.wav'),
        { shouldPlay: false, volume: 1.0 }
      );
      const { sound: accent } = await Audio.Sound.createAsync(
        require('../../assets/accent.wav'),
        { shouldPlay: false, volume: 1.0 }
      );
      if (!mounted) { click.unloadAsync(); accent.unloadAsync(); return; }
      clickSoundRef.current  = click;
      accentSoundRef.current = accent;
      soundsReady.current    = true;
    }
    loadSounds().catch(console.warn);
    return () => {
      mounted = false;
      clickSoundRef.current?.unloadAsync();
      accentSoundRef.current?.unloadAsync();
    };
  }, []);

  const tick = useCallback(() => {
    const beat    = beatRef.current;
    const isFirst = beat === 0;

    // Visual flash
    setIsDownbeat(isFirst);
    setFlash(true);
    setCurrentBeat(beat);
    setCurrentBar(barRef.current);
    setTimeout(() => setFlash(false), 80);

    // Sound — replayAsync() atomically seeks to 0 and plays
    if (soundRef.current && soundsReady.current) {
      const sound = isFirst ? accentSoundRef.current : clickSoundRef.current;
      sound?.replayAsync().catch(() => {});
    }

    // Haptics
    if (hapticsRef.current) vibrate(isFirst);

    // Advance beat / bar
    const nextBeat = beat + 1;
    if (nextBeat >= timeSigRef.current) {
      beatRef.current = 0;
      const nextBar = barRef.current + 1;
      const total   = barsRef.current;
      if (total > 0 && nextBar >= total) {
        clearTimeout(timerRef.current);
        isPlayingRef.current = false;
        setIsPlaying(false);
        setFlash(false);
        beatRef.current = 0;
        barRef.current  = 0;
        setCurrentBeat(0);
        setCurrentBar(total - 1);
        onFinishedRef.current?.();
        return;
      }
      barRef.current = nextBar;
    } else {
      beatRef.current = nextBeat;
    }

    // Self-correcting scheduler
    const interval   = (60 / bpmRef.current) * 1000;
    const nextExpected = expectedRef.current + interval;
    const delay      = Math.max(0, nextExpected - Date.now());
    expectedRef.current = nextExpected;
    timerRef.current = setTimeout(tick, delay);
  }, []);

  const start = useCallback(() => {
    beatRef.current      = 0;
    barRef.current       = 0;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setCurrentBeat(0);
    setCurrentBar(0);
    expectedRef.current  = Date.now();
    tick();
  }, [tick]);

  const stop = useCallback(() => {
    clearTimeout(timerRef.current);
    isPlayingRef.current = false;
    setIsPlaying(false);
    setFlash(false);
    setCurrentBeat(0);
    setCurrentBar(0);
    beatRef.current = 0;
    barRef.current  = 0;
  }, []);

  const toggle = useCallback(() => {
    isPlayingRef.current ? stop() : start();
  }, [start, stop]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { isPlaying, currentBeat, currentBar, flash, isDownbeat, toggle, start, stop };
}
