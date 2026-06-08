import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
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

  // Double-buffer: A plays while B seeks back to 0, then swap
  const clickA  = useAudioPlayer(require('../../assets/click.wav'));
  const clickB  = useAudioPlayer(require('../../assets/click.wav'));
  const accentA = useAudioPlayer(require('../../assets/accent.wav'));
  const accentB = useAudioPlayer(require('../../assets/accent.wav'));

  const timerRef     = useRef(null);
  const beatRef      = useRef(0);
  const barRef       = useRef(0);
  const expectedRef  = useRef(0);
  const isPlayingRef = useRef(false);
  // Which buffer is "active" (currently playing)
  const clickActive  = useRef('A');  // 'A' or 'B'
  const accentActive = useRef('A');

  const bpmRef        = useRef(bpm);           bpmRef.current = bpm;
  const timeSigRef    = useRef(timeSignature); timeSigRef.current = timeSignature;
  const barsRef       = useRef(bars);          barsRef.current = bars;
  const soundRef      = useRef(soundEnabled);  soundRef.current = soundEnabled;
  const hapticsRef    = useRef(hapticsEnabled);hapticsRef.current = hapticsEnabled;
  const onFinishedRef = useRef(onFinished);    onFinishedRef.current = onFinished;

  // Keep player refs stable
  const clickARef  = useRef(clickA);  clickARef.current  = clickA;
  const clickBRef  = useRef(clickB);  clickBRef.current  = clickB;
  const accentARef = useRef(accentA); accentARef.current = accentA;
  const accentBRef = useRef(accentB); accentBRef.current = accentB;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldPlayInBackground: true,
    }).catch(() => {});
  }, []);

  const playSound = useCallback((isFirst) => {
    if (isFirst) {
      // Pick the inactive accent player and play it
      const active   = accentActive.current;
      const inactive = active === 'A' ? 'B' : 'A';
      const toPlay   = active   === 'A' ? accentARef.current : accentBRef.current;
      const toPrep   = inactive === 'A' ? accentARef.current : accentBRef.current;

      accentActive.current = inactive; // swap
      try { toPlay.play(); } catch {}
      // Seek the OLD active player back to 0 while it's no longer needed
      try { toPrep.seekTo(0); } catch {}
    } else {
      const active   = clickActive.current;
      const inactive = active === 'A' ? 'B' : 'A';
      const toPlay   = active   === 'A' ? clickARef.current : clickBRef.current;
      const toPrep   = inactive === 'A' ? clickARef.current : clickBRef.current;

      clickActive.current = inactive;
      try { toPlay.play(); } catch {}
      try { toPrep.seekTo(0); } catch {}
    }
  }, []);

  const tick = useCallback(() => {
    const beat    = beatRef.current;
    const isFirst = beat === 0;

    setIsDownbeat(isFirst);
    setFlash(true);
    setCurrentBeat(beat);
    setCurrentBar(barRef.current);
    setTimeout(() => setFlash(false), 80);

    if (soundRef.current)   playSound(isFirst);
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
    const interval     = (60 / bpmRef.current) * 1000;
    const nextExpected = expectedRef.current + interval;
    const delay        = Math.max(0, nextExpected - Date.now());
    expectedRef.current = nextExpected;
    timerRef.current   = setTimeout(tick, delay);
  }, [playSound]);

  const start = useCallback(() => {
    // Pre-seek all players to 0 before starting
    try { clickARef.current.seekTo(0);  } catch {}
    try { clickBRef.current.seekTo(0);  } catch {}
    try { accentARef.current.seekTo(0); } catch {}
    try { accentBRef.current.seekTo(0); } catch {}
    clickActive.current  = 'A';
    accentActive.current = 'A';

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
