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

  // Two players per sound = no seek conflict between consecutive beats
  const click1 = useAudioPlayer(require('../../assets/click.wav'));
  const click2 = useAudioPlayer(require('../../assets/click.wav'));
  const accent1 = useAudioPlayer(require('../../assets/accent.wav'));
  const accent2 = useAudioPlayer(require('../../assets/accent.wav'));

  const timerRef      = useRef(null);
  const beatRef       = useRef(0);
  const barRef        = useRef(0);
  const expectedRef   = useRef(0);
  const isPlayingRef  = useRef(false);
  const clickToggle   = useRef(false);  // alternate between click1/click2
  const accentToggle  = useRef(false);  // alternate between accent1/accent2

  // Refs so tick() never reads stale values
  const bpmRef           = useRef(bpm);           bpmRef.current = bpm;
  const timeSigRef       = useRef(timeSignature); timeSigRef.current = timeSignature;
  const barsRef          = useRef(bars);          barsRef.current = bars;
  const soundRef         = useRef(soundEnabled);  soundRef.current = soundEnabled;
  const hapticsRef       = useRef(hapticsEnabled);hapticsRef.current = hapticsEnabled;
  const onFinishedRef    = useRef(onFinished);    onFinishedRef.current = onFinished;
  const click1Ref        = useRef(click1);        click1Ref.current = click1;
  const click2Ref        = useRef(click2);        click2Ref.current = click2;
  const accent1Ref       = useRef(accent1);       accent1Ref.current = accent1;
  const accent2Ref       = useRef(accent2);       accent2Ref.current = accent2;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldPlayInBackground: true,
    }).catch(() => {});
  }, []);

  const playSound = useCallback((isFirst) => {
    if (isFirst) {
      // Alternate between accent1 and accent2
      accentToggle.current = !accentToggle.current;
      const p = accentToggle.current ? accent1Ref.current : accent2Ref.current;
      try { p.seekTo(0); p.play(); } catch {}
    } else {
      clickToggle.current = !clickToggle.current;
      const p = clickToggle.current ? click1Ref.current : click2Ref.current;
      try { p.seekTo(0); p.play(); } catch {}
    }
  }, []);

  const tick = useCallback(() => {
    const beat    = beatRef.current;
    const isFirst = beat === 0;

    // Visual
    setIsDownbeat(isFirst);
    setFlash(true);
    setCurrentBeat(beat);
    setCurrentBar(barRef.current);
    setTimeout(() => setFlash(false), 80);

    // Sound & haptics
    if (soundRef.current)   playSound(isFirst);
    if (hapticsRef.current) vibrate(isFirst);

    // Advance beat / bar
    const nextBeat = beat + 1;
    if (nextBeat >= timeSigRef.current) {
      beatRef.current = 0;
      const nextBar  = barRef.current + 1;
      const total    = barsRef.current;
      if (total > 0 && nextBar >= total) {
        // End of track — stop
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

    // Self-correcting scheduler (compensates JS timer drift)
    const interval    = (60 / bpmRef.current) * 1000;
    const nextExpected = expectedRef.current + interval;
    const delay       = Math.max(0, nextExpected - Date.now());
    expectedRef.current = nextExpected;
    timerRef.current  = setTimeout(tick, delay);
  }, [playSound]);

  const start = useCallback(() => {
    beatRef.current  = 0;
    barRef.current   = 0;
    clickToggle.current  = false;
    accentToggle.current = false;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setCurrentBeat(0);
    setCurrentBar(0);
    expectedRef.current = Date.now();
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
