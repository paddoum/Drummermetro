import React, { useState, useEffect, useCallback } from 'react';
import { Modal, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { loadPlaylist, savePlaylist } from './src/store/playlistStore';
import MetronomeScreen from './src/screens/MetronomeScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    loadPlaylist().then(setPlaylist);
  }, []);

  const handleUpdatePlaylist = useCallback((newPlaylist) => {
    setPlaylist(newPlaylist);
    savePlaylist(newPlaylist);
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((i) => Math.min(i + 1, playlist.length - 1));
  }, [playlist.length]);

  if (playlist.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#666', fontSize: 16 }}>Chargement…</Text>
      </View>
    );
  }

  const currentTrack = playlist[activeIndex] ?? playlist[0];

  return (
    <>
      <MetronomeScreen
        track={currentTrack}
        hasNext={activeIndex < playlist.length - 1}
        onNext={handleNext}
        onOpenPlaylist={() => setShowPlaylist(true)}
        soundEnabled={soundEnabled}
        hapticsEnabled={hapticsEnabled}
      />

      {/* Toggles son + vibration */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, !soundEnabled && styles.toggleBtnOff]}
          onPress={() => setSoundEnabled((s) => !s)}
        >
          <Text style={styles.toggleIcon}>{soundEnabled ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, !hapticsEnabled && styles.toggleBtnOff]}
          onPress={() => setHapticsEnabled((h) => !h)}
        >
          <Text style={styles.toggleIcon}>{hapticsEnabled ? '📳' : '📴'}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPlaylist}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <PlaylistScreen
          playlist={playlist}
          activeIndex={activeIndex}
          onSelectTrack={setActiveIndex}
          onUpdatePlaylist={handleUpdatePlaylist}
          onClose={() => setShowPlaylist(false)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    flexDirection: 'column',
    gap: 10,
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleBtnOff: {
    borderColor: '#FF4444',
    backgroundColor: '#1a0a0a',
  },
  toggleIcon: {
    fontSize: 20,
  },
});
