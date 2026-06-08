import { useRef, useState, useCallback, useEffect } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const clickSource = require('../../assets/click.wav');
const accentSource = require('../../assets/accent.wav');

export function useMetronome({ bpm, timeSignature, bars, onFinished, soundEnabled }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);
  const [flash, setFlash] = useState(false);
  const [isDownbeat, setIsDownbeat] = useState(false);

  const clickPlayer = useAudioPlayer(clickSource);
  const accentPlayer = useAudioPlayer(accentSource);

  const intervalRef = useRef(null);
  const beatRef = useRef(0);
  const barRef = useRef(0);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
  }, []);

  const tick = useCallback(() => {
    const beat = beatRef.current;
    const bar = barRef.current;
    const isFirst = beat === 0;

    setIsDownbeat(isFirst);
    setFlash(true);
    setCurrentBeat(beat);
    setCurrentBar(bar);

    if (soundEnabledRef.current) {
      const player = isFirst ? accentPlayer : clickPlayer;
      try {
        player.seekTo(0);
        player.play();
      } catch {}
    }

    Haptics.impactAsync(
      isFirst ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
    ).catch(() => {});

    setTimeout(() => setFlash(false), 80);

    const nextBeat = beat + 1;
    if (nextBeat >= timeSignature) {
      beatRef.current = 0;
      const nextBar = bar + 1;
      if (bars > 0 && nextBar >= bars) {
        // Fin des mesures : on s'arrête, l'utilisateur passe manuellement au suivant
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setFlash(false);
        beatRef.current = 0;
        barRef.current = 0;
        setCurrentBeat(0);
        setCurrentBar(bars - 1); // reste affiché sur la dernière mesure
        onFinished?.();
      } else {
        barRef.current = nextBar;
      }
    } else {
      beatRef.current = nextBeat;
    }
  }, [bpm, timeSignature, bars, onFinished, clickPlayer, accentPlayer]);

  const start = useCallback(() => {
    beatRef.current = 0;
    barRef.current = 0;
    setCurrentBeat(0);
    setCurrentBar(0);
    setIsPlaying(true);
    const interval = (60 / bpm) * 1000;
    tick();
    intervalRef.current = setInterval(tick, interval);
  }, [bpm, tick]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsPlaying(false);
    setFlash(false);
    setCurrentBeat(0);
    setCurrentBar(0);
    beatRef.current = 0;
    barRef.current = 0;
  }, []);

  const toggle = useCallback(() => {
    isPlaying ? stop() : start();
  }, [isPlaying, start, stop]);

  // Restart interval when bpm changes while playing
  useEffect(() => {
    if (isPlaying) {
      clearInterval(intervalRef.current);
      const interval = (60 / bpm) * 1000;
      intervalRef.current = setInterval(tick, interval);
    }
  }, [bpm, tick]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { isPlaying, currentBeat, currentBar, flash, isDownbeat, toggle, start, stop };
}
