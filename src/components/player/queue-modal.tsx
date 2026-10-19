import { Image } from 'expo-image';
import {
  ChevronDown,
  ChevronUp,
  ListMusic,
  Play,
  Trash2,
  Volume2,
  X,
} from 'lucide-react-native';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { usePlayer } from '@/contexts/player-context';
import { Track } from '@/types/player';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400';

interface QueueModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QueueModal({ visible, onClose }: QueueModalProps) {
  const {
    activeTrack,
    upcomingQueue,
    currentTrackIndex,
    playTrackFromQueue,
    removeFromQueue,
    clearUpcomingQueue,
    moveQueueItem,
  } = usePlayer();

  const handlePlayQueuedTrack = (index: number) => {
    // Índice real no trackList: currentTrackIndex + 1 + index
    const realIndex = currentTrackIndex + 1 + index;
    playTrackFromQueue(realIndex);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <SafeAreaView edges={['bottom']} style={styles.sheetContainer}>
          {/* Barra de arraste */}
          <View style={styles.dragPillContainer}>
            <View style={styles.dragPill} />
          </View>

          {/* Header do Drawer */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ListMusic size={20} color={Colors.dark.accent} />
              <Text style={styles.headerTitle}>Fila de Reprodução</Text>
              {upcomingQueue.length > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {upcomingQueue.length}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {upcomingQueue.length > 0 && (
                <Pressable
                  onPress={clearUpcomingQueue}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.clearButton,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Trash2 size={15} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.clearButtonText}>Limpar</Text>
                </Pressable>
              )}

              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.buttonPressed,
                ]}>
                <X size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Lista de Faixas com Scroll */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Seção 1: Tocando Agora */}
            {activeTrack ? (
              <View style={styles.section}>
                <Text style={styles.sectionSubtitle}>TOCANDO AGORA</Text>
                <View style={styles.nowPlayingCard}>
                  <Image
                    source={{ uri: activeTrack.thumbnail || DEFAULT_COVER }}
                    style={styles.nowPlayingImage}
                    contentFit="cover"
                  />
                  <View style={styles.nowPlayingInfo}>
                    <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                      {activeTrack.title}
                    </Text>
                    <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                      {activeTrack.members || 'Artista Desconhecido'}
                    </Text>
                  </View>
                  <View style={styles.playingBadge}>
                    <Volume2 size={16} color={Colors.dark.accent} />
                  </View>
                </View>
              </View>
            ) : null}

            {/* Seção 2: A Seguir na Fila */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionSubtitle}>
                  A SEGUIR NA FILA{' '}
                  {upcomingQueue.length > 0 ? `(${upcomingQueue.length})` : ''}
                </Text>
              </View>

              {upcomingQueue.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ListMusic
                    size={40}
                    color="rgba(255, 255, 255, 0.2)"
                    style={{ marginBottom: 12 }}
                  />
                  <Text style={styles.emptyTitle}>
                    Nenhum hino na fila a seguir.
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Toque em qualquer hino da Home para iniciar uma nova fila
                    automática ou adicione mais faixas.
                  </Text>
                </View>
              ) : (
                <View style={styles.queueList}>
                  {upcomingQueue.map((track: Track, idx: number) => {
                    const isFirst = idx === 0;
                    const isLast = idx === upcomingQueue.length - 1;

                    return (
                      <View key={`${track.id}-${idx}`} style={styles.queueItem}>
                        {/* Botão de toque para reproduzir direto */}
                        <Pressable
                          onPress={() => handlePlayQueuedTrack(idx)}
                          style={({ pressed }) => [
                            styles.trackInfoPressable,
                            pressed && styles.itemPressed,
                          ]}>
                          <Text style={styles.queueIndex}>
                            {(idx + 1).toString().padStart(2, '0')}
                          </Text>

                          <Image
                            source={{
                              uri: track.thumbnail || DEFAULT_COVER,
                            }}
                            style={styles.queueImage}
                            contentFit="cover"
                          />

                          <View style={styles.queueTextGroup}>
                            <Text
                              style={styles.queueTrackTitle}
                              numberOfLines={1}>
                              {track.title}
                            </Text>
                            <Text
                              style={styles.queueTrackArtist}
                              numberOfLines={1}>
                              {track.members || 'Artista Desconhecido'}
                            </Text>
                          </View>
                        </Pressable>

                        {/* Ações da faixa (Reordenar Cima/Baixo, Tocar e Remover) */}
                        <View style={styles.trackActionsRow}>
                          {/* Reordenar para Cima */}
                          <Pressable
                            disabled={isFirst}
                            onPress={() => moveQueueItem(idx, idx - 1)}
                            hitSlop={6}
                            style={[
                              styles.reorderButton,
                              isFirst && styles.disabledAction,
                            ]}>
                            <ChevronUp
                              size={16}
                              color={
                                isFirst
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'rgba(255, 255, 255, 0.65)'
                              }
                            />
                          </Pressable>

                          {/* Reordenar para Baixo */}
                          <Pressable
                            disabled={isLast}
                            onPress={() => moveQueueItem(idx, idx + 1)}
                            hitSlop={6}
                            style={[
                              styles.reorderButton,
                              isLast && styles.disabledAction,
                            ]}>
                            <ChevronDown
                              size={16}
                              color={
                                isLast
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'rgba(255, 255, 255, 0.65)'
                              }
                            />
                          </Pressable>

                          {/* Tocar Agora */}
                          <Pressable
                            onPress={() => handlePlayQueuedTrack(idx)}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.actionPlayButton,
                              pressed && styles.buttonPressed,
                            ]}>
                            <Play
                              size={14}
                              color="#12140F"
                              fill="#12140F"
                              style={{ marginLeft: 2 }}
                            />
                          </Pressable>

                          {/* Remover da Fila */}
                          <Pressable
                            onPress={() => removeFromQueue(track.id)}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.actionRemoveButton,
                              pressed && styles.buttonPressed,
                            ]}>
                            <X size={16} color="rgba(255, 255, 255, 0.5)" />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    maxHeight: '80%',
    minHeight: '45%',
    backgroundColor: '#141611',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  dragPillContainer: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragPill: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerBadge: {
    backgroundColor: 'rgba(4, 211, 97, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  clearButtonText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  buttonPressed: {
    opacity: 0.65,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
    fontFamily: Fonts.mono,
  },
  nowPlayingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 211, 97, 0.08)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(4, 211, 97, 0.28)',
    gap: 12,
  },
  nowPlayingImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  nowPlayingInfo: {
    flex: 1,
    minWidth: 0,
  },
  nowPlayingTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nowPlayingArtist: {
    fontSize: 13,
    color: Colors.dark.accent,
    marginTop: 2,
  },
  playingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(4, 211, 97, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 18,
  },
  queueList: {
    gap: 8,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackInfoPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  itemPressed: {
    opacity: 0.7,
  },
  queueIndex: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: 'rgba(255, 255, 255, 0.35)',
    width: 20,
    textAlign: 'center',
  },
  queueImage: {
    width: 42,
    height: 42,
    borderRadius: 6,
  },
  queueTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  queueTrackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  queueTrackArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  trackActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  reorderButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  disabledAction: {
    opacity: 0.3,
  },
  actionPlayButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRemoveButton: {
    padding: 6,
    borderRadius: 8,
  },
});
