import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { AudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

// Pre-instantiate players once at module level — no reload on every render
const clickPlayer = new AudioPlayer(require('../../assets/click.wav'));
const accentPlayer = new AudioPlayer(require('../../assets/accent.wav'));

setAudioModeAsync({ playsInSilentModeIOS: true, shouldPlayInBackground: true }).catch(() => {});

function playSound(isFirst) {
  const player = isFirst ? accentPlayer : clickPlayer;
  try {
    // Seek to 0 first (sync on native, ignored if already at 0), then play
    player.currentTime = 0;
    player.play();
  } catch {
    try { player.play(); } catch {}
  }
}

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

  const timerRef = useRef(null);
  const beatRef = useRef(0);
  const barRef = useRef(0);
  const expectedTimeRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Keep refs in sync so tick() never reads stale values
  const bpmRef = useRef(bpm);               bpmRef.current = bpm;
  const timeSignatureRef = useRef(timeSignature); timeSignatureRef.current = timeSignature;
  const barsRef = useRef(bars);             barsRef.current = bars;
  const soundEnabledRef = useRef(soundEnabled);   soundEnabledRef.current = soundEnabled;
  const hapticsEnabledRef = useRef(hapticsEnabled); hapticsEnabledRef.current = hapticsEnabled;
  const onFinishedRef = useRef(onFinished); onFinishedRef.current = onFinished;

  const tick = useCallback(() => {
    const beat = beatRef.current;
    const isFirst = beat === 0;

    // Visual
    setIsDownbeat(isFirst);
    setFlash(true);
    setCurrentBeat(beat);
    setCurrentBar(barRef.current);
    setTimeout(() => setFlash(false), 80);

    // Sound
    if (soundEnabledRef.current) playSound(isFirst);

    // Haptics
    if (hapticsEnabledRef.current) vibrate(isFirst);

    // Advance counters
    const nextBeat = beat + 1;
    if (nextBeat >= timeSignatureRef.current) {
      beatRef.current = 0;
      const nextBar = barRef.current + 1;
      const totalBars = barsRef.current;
      if (totalBars > 0 && nextBar >= totalBars) {
        clearTimeout(timerRef.current);
        isPlayingRef.current = false;
        setIsPlaying(false);
        setFlash(false);
        beatRef.current = 0;
        barRef.current = 0;
        setCurrentBeat(0);
        setCurrentBar(totalBars - 1);
        onFinishedRef.current?.();
        return;
      }
      barRef.current = nextBar;
    } else {
      beatRef.current = nextBeat;
    }

    // Self-correcting scheduler
    const interval = (60 / bpmRef.current) * 1000;
    const nextExpected = expectedTimeRef.current + interval;
    const delay = Math.max(0, nextExpected - Date.now());
    expectedTimeRef.current = nextExpected;
    timerRef.current = setTimeout(tick, delay);
  }, []);

  const start = useCallback(() => {
    beatRef.current = 0;
    barRef.current = 0;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setCurrentBeat(0);
    setCurrentBar(0);
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
