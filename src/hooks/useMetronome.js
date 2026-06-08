import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const clickSource = require('../../assets/click.wav');
const accentSource = require('../../assets/accent.wav');

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

  const clickPlayer = useAudioPlayer(clickSource);
  const accentPlayer = useAudioPlayer(accentSource);

  // Refs — never stale inside the scheduler loop
  const timerRef = useRef(null);
  const beatRef = useRef(0);
  const barRef = useRef(0);
  const expectedTimeRef = useRef(0);   // wall-clock time of the next tick
  const isPlayingRef = useRef(false);

  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const timeSignatureRef = useRef(timeSignature);
  timeSignatureRef.current = timeSignature;
  const barsRef = useRef(bars);
  barsRef.current = bars;
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const hapticsEnabledRef = useRef(hapticsEnabled);
  hapticsEnabledRef.current = hapticsEnabled;
  const clickPlayerRef = useRef(clickPlayer);
  clickPlayerRef.current = clickPlayer;
  const accentPlayerRef = useRef(accentPlayer);
  accentPlayerRef.current = accentPlayer;
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
  }, []);

  // Core tick — runs on every beat
  const tick = useCallback(() => {
    const beat = beatRef.current;
    const isFirst = beat === 0;

    // Visual flash
    setIsDownbeat(isFirst);
    setFlash(true);
    setCurrentBeat(beat);
    setCurrentBar(barRef.current);
    setTimeout(() => setFlash(false), 80);

    // Sound — play directly, no seekTo (avoids async latency)
    if (soundEnabledRef.current) {
      const player = isFirst ? accentPlayerRef.current : clickPlayerRef.current;
      try { player.play(); } catch {}
    }

    // Haptics
    if (hapticsEnabledRef.current) {
      vibrate(isFirst);
    }

    // Advance beat/bar counters
    const nextBeat = beat + 1;
    if (nextBeat >= timeSignatureRef.current) {
      beatRef.current = 0;
      const nextBar = barRef.current + 1;
      const totalBars = barsRef.current;
      if (totalBars > 0 && nextBar >= totalBars) {
        // End of track — stop and notify
        clearTimeout(timerRef.current);
        isPlayingRef.current = false;
        setIsPlaying(false);
        setFlash(false);
        beatRef.current = 0;
        barRef.current = 0;
        setCurrentBeat(0);
        setCurrentBar(totalBars - 1);
        onFinishedRef.current?.();
        return; // don't schedule next tick
      } else {
        barRef.current = nextBar;
      }
    } else {
      beatRef.current = nextBeat;
    }

    // Self-correcting scheduler:
    // expectedTimeRef = when THIS tick was supposed to fire
    // next expected   = expectedTimeRef + interval
    // delay           = max(0, nextExpected - now)  → shrinks when we're late
    const interval = (60 / bpmRef.current) * 1000;
    const nextExpected = expectedTimeRef.current + interval;
    const delay = Math.max(0, nextExpected - Date.now());
    expectedTimeRef.current = nextExpected;
    timerRef.current = setTimeout(tick, delay);
  }, []); // no deps — all state read via refs

  const start = useCallback(() => {
    beatRef.current = 0;
    barRef.current = 0;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setCurrentBeat(0);
    setCurrentBar(0);

    // Set expectedTime = now so first tick fires immediately,
    // and subsequent ticks self-correct from this anchor.
    expectedTimeRef.current = Date.now();
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
    barRef.current = 0;
  }, []);

  const toggle = useCallback(() => {
    isPlayingRef.current ? stop() : start();
  }, [start, stop]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return { isPlaying, currentBeat, currentBar, flash, isDownbeat, toggle, start, stop };
}
