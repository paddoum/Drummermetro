import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar
} from 'react-native';
import { useMetronome } from '../hooks/useMetronome';

export default function MetronomeScreen({ track, onNext, hasNext, onOpenPlaylist, soundEnabled }) {
  const { name, bpm, timeSignature, bars } = track;

  const { isPlaying, currentBeat, currentBar, flash, isDownbeat, toggle, stop } = useMetronome({
    bpm,
    timeSignature,
    bars,
    soundEnabled,
  });

  const flashColor = isDownbeat ? '#FF4444' : '#FFFFFF';
  const bgColor = flash ? flashColor : '#000000';
  const totalBars = bars > 0 ? bars : '∞';

  const beats = Array.from({ length: timeSignature }, (_, i) => i);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onOpenPlaylist} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>☰ Playlist</Text>
        </TouchableOpacity>
        <Text style={styles.trackName} numberOfLines={1}>{name}</Text>
        <View style={{ width: 90 }} />
      </View>

      {/* BPM display */}
      <View style={styles.bpmContainer}>
        <Text style={[styles.bpmNumber, flash && styles.bpmFlash]}>{bpm}</Text>
        <Text style={styles.bpmLabel}>BPM</Text>
      </View>

      {/* Bar counter */}
      <View style={styles.barContainer}>
        <Text style={styles.barText}>
          Mesure <Text style={styles.barCurrent}>{currentBar + 1}</Text>
          <Text style={styles.barSep}> / </Text>
          <Text style={styles.barTotal}>{totalBars}</Text>
        </Text>
        <Text style={styles.timeSig}>{timeSignature}/4</Text>
      </View>

      {/* Beat dots */}
      <View style={styles.beatsRow}>
        {beats.map((i) => (
          <View
            key={i}
            style={[
              styles.beatDot,
              i === currentBeat && isPlaying && styles.beatDotActive,
              i === 0 && styles.beatDotFirst,
              i === currentBeat && i === 0 && isPlaying && styles.beatDotFirstActive,
            ]}
          />
        ))}
      </View>

      {/* Play button */}
      <TouchableOpacity style={styles.playButton} onPress={toggle} activeOpacity={0.8}>
        <Text style={styles.playIcon}>{isPlaying ? '⏹' : '▶'}</Text>
      </TouchableOpacity>

      {/* Next track */}
      {hasNext && (
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => { stop(); onNext(); }}
        >
          <Text style={styles.nextBtnText}>Suivant ›</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerBtn: {
    padding: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    width: 90,
  },
  headerBtnText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  trackName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  bpmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bpmNumber: {
    fontSize: 120,
    fontWeight: '100',
    color: '#fff',
    letterSpacing: -4,
    lineHeight: 130,
  },
  bpmFlash: {
    color: '#000',
  },
  bpmLabel: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
    letterSpacing: 6,
    marginTop: -10,
  },
  barContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  barText: {
    fontSize: 20,
    color: '#888',
    fontWeight: '400',
  },
  barCurrent: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 24,
  },
  barSep: {
    color: '#555',
  },
  barTotal: {
    color: '#666',
  },
  timeSig: {
    color: '#555',
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 2,
  },
  beatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 48,
  },
  beatDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  beatDotFirst: {
    borderColor: '#FF4444',
  },
  beatDotActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  beatDotFirstActive: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  playButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  playIcon: {
    fontSize: 36,
    color: '#fff',
  },
  nextBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  nextBtnText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
});
