import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Check,
  Disc3,
  FolderPlus,
  Heart,
  ListEnd,
  ListPlus,
  Play,
  User,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddToPlaylistModal from '@/components/player/add-to-playlist-modal';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePlayer } from '@/contexts/player-context';
import { Track } from '@/types/player';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400';

interface TrackActionsModalProps {
  track: Track | null;
  visible: boolean;
  onClose: () => void;
}

export default function TrackActionsModal({
  track,
  visible,
  onClose,
}: TrackActionsModalProps) {
  const { play, addToQueueNext, addToQueueEnd } = usePlayer();
  const { likedTracks, toggleLike } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);

  if (!track) return null;

  const isLiked = track ? likedTracks.has(track.id) : false;

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 700);
  };

  const handlePlayNow = async () => {
    await play(track);
    onClose();
  };

  const handleToggleLike = async () => {
    const success = await toggleLike(track.id);
    if (success) {
      showToast(isLiked ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    } else {
      onClose();
    }
  };

  const handlePlayNext = () => {
    addToQueueNext(track);
    showToast('Adicionado para tocar a seguir');
  };

  const handleAddToEnd = () => {
    addToQueueEnd(track);
    showToast('Adicionado ao fim da fila');
  };

  const handleGoToArtist = () => {
    if (!track) return;
    const artistKey = track.authorId || track.members;
    if (artistKey) {
      onClose();
      router.push({
        pathname: '/(tabs)/home/artist/[id]' as any,
        params: { id: artistKey, name: track.members },
      });
    }
  };

  const handleGoToAlbum = () => {
    if (!track?.albumId || track.albumId === 'no-album') return;
    onClose();
    router.push({
      pathname: '/(tabs)/home/album/[id]' as any,
      params: { id: track.albumId, title: track.albumName || 'Álbum' },
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <SafeAreaView edges={['bottom']} style={styles.sheetContainer}>
          <View style={styles.dragPillContainer}>
            <View style={styles.dragPill} />
          </View>

          {/* Cabeçalho com dados da faixa */}
          <View style={styles.trackHeader}>
            <Image
              source={{ uri: track.thumbnail || DEFAULT_COVER }}
              style={styles.trackImage}
              contentFit="cover"
            />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {track.members || 'Artista Desconhecido'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.buttonPressed,
              ]}>
              <X size={18} color="rgba(255, 255, 255, 0.7)" />
            </Pressable>
          </View>

          {toastMessage ? (
            <View style={styles.toastContainer}>
              <Check size={18} color={Colors.dark.accent} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          ) : (
            <View style={styles.actionsList}>
              {/* Tocar Agora */}
              <Pressable
                onPress={handlePlayNow}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.actionRowPressed,
                ]}>
                <View style={styles.actionIconContainer}>
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <View style={styles.actionTextCol}>
                  <Text style={styles.actionTitle}>Tocar Agora</Text>
                  <Text style={styles.actionSubtitle}>
                    Inicia a reprodução desta faixa imediatamente
                  </Text>
                </View>
              </Pressable>

              {/* Curtir / Salvar nos Favoritos */}
              <Pressable
                onPress={handleToggleLike}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.actionRowPressed,
                ]}>
                <View
                  style={[
                    styles.actionIconContainer,
                    isLiked && { backgroundColor: 'rgba(255, 77, 77, 0.15)' },
                  ]}>
                  <Heart
                    size={18}
                    color={isLiked ? '#FF4D4D' : 'rgba(255, 255, 255, 0.8)'}
                    fill={isLiked ? '#FF4D4D' : 'transparent'}
                  />
                </View>
                <View style={styles.actionTextCol}>
                  <Text
                    style={[
                      styles.actionTitle,
                      isLiked && { color: '#FF7070' },
                    ]}>
                    {isLiked ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {isLiked
                      ? 'Remover este hino da sua lista de curtidas'
                      : 'Adicionar este hino aos seus favoritos'}
                  </Text>
                </View>
              </Pressable>

              {/* Tocar a Seguir */}
              <Pressable
                onPress={handlePlayNext}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.actionRowPressed,
                ]}>
                <View style={styles.actionIconContainer}>
                  <ListPlus size={18} color={Colors.dark.accent} />
                </View>
                <View style={styles.actionTextCol}>
                  <Text style={styles.actionTitle}>Tocar a Seguir</Text>
                  <Text style={styles.actionSubtitle}>
                    Insere logo após a faixa que está tocando
                  </Text>
                </View>
              </Pressable>

              {/* Adicionar ao Fim da Fila */}
              <Pressable
                onPress={handleAddToEnd}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.actionRowPressed,
                ]}>
                <View style={styles.actionIconContainer}>
                  <ListEnd size={18} color="rgba(255, 255, 255, 0.8)" />
                </View>
                <View style={styles.actionTextCol}>
                  <Text style={styles.actionTitle}>
                    Adicionar ao Fim da Fila
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    Toca depois de todas as faixas enfileiradas
                  </Text>
                </View>
              </Pressable>

              {/* Salvar na Playlist */}
              <Pressable
                onPress={() => setIsAddToPlaylistOpen(true)}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.actionRowPressed,
                ]}>
                <View style={styles.actionIconContainer}>
                  <FolderPlus size={18} color="rgba(255, 255, 255, 0.8)" />
                </View>
                <View style={styles.actionTextCol}>
                  <Text style={styles.actionTitle}>Salvar na Playlist</Text>
                  <Text style={styles.actionSubtitle}>
                    Adicione à uma playlist personalizada
                  </Text>
                </View>
              </Pressable>

              {/* Ir para o Artista */}
              {Boolean(track.authorId || track.members) && (
                <Pressable
                  onPress={handleGoToArtist}
                  style={({ pressed }) => [
                    styles.actionRow,
                    pressed && styles.actionRowPressed,
                  ]}>
                  <View style={styles.actionIconContainer}>
                    <User size={18} color="rgba(255, 255, 255, 0.8)" />
                  </View>
                  <View style={styles.actionTextCol}>
                    <Text style={styles.actionTitle}>Ir para o Artista</Text>
                    <Text style={styles.actionSubtitle}>
                      {track.members || 'Ver catálogo e álbuns'}
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* Ir para o Álbum */}
              {Boolean(track.albumId && track.albumId !== 'no-album') && (
                <Pressable
                  onPress={handleGoToAlbum}
                  style={({ pressed }) => [
                    styles.actionRow,
                    pressed && styles.actionRowPressed,
                  ]}>
                  <View style={styles.actionIconContainer}>
                    <Disc3 size={18} color="rgba(255, 255, 255, 0.8)" />
                  </View>
                  <View style={styles.actionTextCol}>
                    <Text style={styles.actionTitle}>Ir para o Álbum</Text>
                    <Text style={styles.actionSubtitle}>
                      {track.albumName || 'Ver faixas do álbum'}
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </SafeAreaView>
      </View>

      <AddToPlaylistModal
        track={track}
        visible={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
        onSuccess={(name) => showToast(`Salvo em "${name}"`)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#161914',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 24,
  },
  dragPillContainer: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  trackImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackArtist: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  buttonPressed: {
    opacity: 0.6,
  },
  actionsList: {
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 14,
  },
  actionRowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
