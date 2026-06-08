import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  SafeAreaView, StatusBar, TextInput, Modal, Alert,
} from 'react-native';
import { generateId } from '../store/playlistStore';

const TIME_SIGS = [2, 3, 4, 5, 6, 7];

function TrackItem({ item, index, isActive, onPress, onDelete, onEdit }) {
  return (
    <View style={[styles.trackItem, isActive && styles.trackItemActive]}>
      <TouchableOpacity style={styles.trackMain} onPress={() => onPress(index)}>
        <View style={styles.trackLeft}>
          <Text style={styles.trackIndex}>{index + 1}</Text>
          <View>
            <Text style={styles.trackName}>{item.name}</Text>
            <Text style={styles.trackMeta}>
              {item.bpm} BPM · {item.timeSignature}/4 · {item.bars > 0 ? `${item.bars} mesures` : '∞'}
            </Text>
          </View>
        </View>
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
      <View style={styles.trackActions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TrackFormModal({ visible, initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [bpm, setBpm] = useState(String(initial?.bpm ?? 120));
  const [timeSig, setTimeSig] = useState(initial?.timeSignature ?? 4);
  const [bars, setBars] = useState(String(initial?.bars ?? 0));

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setBpm(String(initial?.bpm ?? 120));
      setTimeSig(initial?.timeSignature ?? 4);
      setBars(String(initial?.bars ?? 0));
    }
  }, [visible, initial]);

  function handleSave() {
    const bpmVal = parseInt(bpm, 10);
    const barsVal = parseInt(bars, 10);
    if (!name.trim()) return Alert.alert('Nom requis');
    if (isNaN(bpmVal) || bpmVal < 20 || bpmVal > 300) return Alert.alert('BPM invalide (20–300)');
    onSave({
      id: initial?.id ?? generateId(),
      name: name.trim(),
      bpm: bpmVal,
      timeSignature: timeSig,
      bars: isNaN(barsVal) || barsVal < 0 ? 0 : barsVal,
    });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{initial ? 'Modifier' : 'Nouveau morceau'}</Text>

          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Intro"
            placeholderTextColor="#555"
            selectionColor="#FF4444"
          />

          <Text style={styles.label}>BPM</Text>
          <TextInput
            style={styles.input}
            value={bpm}
            onChangeText={setBpm}
            keyboardType="number-pad"
            selectionColor="#FF4444"
          />

          <Text style={styles.label}>Signature rythmique</Text>
          <View style={styles.timeSigRow}>
            {TIME_SIGS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.timeSigBtn, timeSig === t && styles.timeSigBtnActive]}
                onPress={() => setTimeSig(t)}
              >
                <Text style={[styles.timeSigBtnText, timeSig === t && styles.timeSigBtnTextActive]}>
                  {t}/4
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nombre de mesures (0 = infini)</Text>
          <TextInput
            style={styles.input}
            value={bars}
            onChangeText={setBars}
            keyboardType="number-pad"
            selectionColor="#FF4444"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PlaylistScreen({ playlist, activeIndex, onSelectTrack, onUpdatePlaylist, onClose }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);

  function handleDelete(id) {
    Alert.alert('Supprimer', 'Supprimer ce morceau ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => onUpdatePlaylist(playlist.filter((t) => t.id !== id)),
      },
    ]);
  }

  function handleSave(track) {
    if (editingTrack) {
      onUpdatePlaylist(playlist.map((t) => (t.id === track.id ? track : t)));
    } else {
      onUpdatePlaylist([...playlist, track]);
    }
  }

  function handleEdit(track) {
    setEditingTrack(track);
    setModalVisible(true);
  }

  function handleAdd() {
    setEditingTrack(null);
    setModalVisible(true);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <Text style={styles.title}>Playlist</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlist}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TrackItem
            item={item}
            index={index}
            isActive={index === activeIndex}
            onPress={(i) => { onSelectTrack(i); onClose(); }}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
        <Text style={styles.addBtnText}>+ Ajouter un morceau</Text>
      </TouchableOpacity>

      <TrackFormModal
        visible={modalVisible}
        initial={editingTrack}
        onSave={handleSave}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#1d1d1d',
    overflow: 'hidden',
  },
  trackItemActive: {
    borderColor: '#FF4444',
    backgroundColor: '#1a0a0a',
  },
  trackMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  trackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  trackIndex: {
    color: '#444',
    fontSize: 13,
    width: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  trackName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackMeta: {
    color: '#666',
    fontSize: 12,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginLeft: 8,
  },
  trackActions: {
    flexDirection: 'row',
    paddingRight: 8,
    gap: 4,
  },
  actionBtn: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 16,
  },
  addBtn: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    backgroundColor: '#FF4444',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  timeSigRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeSigBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  timeSigBtnActive: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  timeSigBtnText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  timeSigBtnTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    padding: 14,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
