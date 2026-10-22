import { Image } from 'expo-image';
import {
  Folder,
  Globe,
  Lock,
  Plus,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { PlaylistItem, playlistService } from '@/services/playlist.service';
import { Track } from '@/types/player';

interface AddToPlaylistModalProps {
  track: Track | null;
  visible: boolean;
  onClose: () => void;
  onSuccess?: (playlistName: string) => void;
}

export default function AddToPlaylistModal({
  track,
  visible,
  onClose,
  onSuccess,
}: AddToPlaylistModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const { user } = useAuth();

  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToId, setAddingToId] = useState<string | null>(null);

  // Criar nova playlist diretamente pelo modal
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!visible || !user) return;

    playlistService
      .getUserPlaylists(user.id)
      .then((list) => {
        if (isMounted) {
          setPlaylists(list);
        }
      })
      .catch((err) => console.warn('Erro ao buscar playlists:', err))
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [visible, user]);

  if (!track) return null;

  const handleSelectPlaylist = async (playlist: PlaylistItem) => {
    setAddingToId(playlist.id);
    try {
      await playlistService.addTrackToPlaylist(playlist.id, track.id);
      if (onSuccess) {
        onSuccess(playlist.name);
      }
      onClose();
    } catch (err: any) {
      console.warn('Erro ao adicionar faixa à playlist:', err);
    } finally {
      setAddingToId(null);
    }
  };

  const handleCreateAndAdd = async () => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    try {
      const created = await playlistService.createPlaylist(trimmed, true);
      await playlistService.addTrackToPlaylist(created.id, track.id);
      if (onSuccess) {
        onSuccess(created.name);
      }
      setIsCreatingNew(false);
      setNewPlaylistName('');
      onClose();
    } catch (err) {
      console.warn('Erro ao criar e adicionar à playlist:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderSubtle,
              paddingBottom: insets.bottom + 20,
            },
          ]}>
          <View style={styles.modalDragPillContainer}>
            <View
              style={[
                styles.modalDragPill,
                { backgroundColor: colors.borderSubtle },
              ]}
            />
          </View>

          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Salvar na Playlist
              </Text>
              <Text
                style={[styles.modalSubtitle, { color: colors.textSecondary }]}
                numberOfLines={1}>
                {track.title}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && { opacity: 0.6 },
              ]}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Opção de Criar Nova Playlist inline */}
          {isCreatingNew ? (
            <View style={styles.inlineCreateBox}>
              <TextInput
                style={[
                  styles.inlineInput,
                  {
                    backgroundColor: colors.cardSecondary,
                    borderColor: colors.accent,
                    color: colors.text,
                  },
                ]}
                placeholder="Nome da nova playlist"
                placeholderTextColor={colors.textSecondary}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
                maxLength={60}
              />
              <View style={styles.inlineActions}>
                <Pressable
                  onPress={() => setIsCreatingNew(false)}
                  style={[
                    styles.inlineCancelBtn,
                    { borderColor: colors.borderSubtle },
                  ]}>
                  <Text
                    style={[
                      styles.inlineBtnText,
                      { color: colors.textSecondary },
                    ]}>
                    Cancelar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateAndAdd}
                  disabled={!newPlaylistName.trim() || isCreating}
                  style={[
                    styles.inlineConfirmBtn,
                    { backgroundColor: colors.accent },
                    (!newPlaylistName.trim() || isCreating) && { opacity: 0.5 },
                  ]}>
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.inlineBtnText,
                        { color: '#FFFFFF', fontFamily: Fonts.bold },
                      ]}>
                      Criar e Salvar
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setIsCreatingNew(true)}
              style={({ pressed }) => [
                styles.createRow,
                {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.borderSubtle,
                },
                pressed && { opacity: 0.75 },
              ]}>
              <View
                style={[
                  styles.plusIconBox,
                  { backgroundColor: 'rgba(4, 211, 97, 0.15)' },
                ]}>
                <Plus size={18} color={colors.accent} />
              </View>
              <Text style={[styles.createRowText, { color: colors.accent }]}>
                Criar Nova Playlist
              </Text>
            </Pressable>
          )}

          {/* Lista de Playlists do Usuário */}
          <ScrollView
            style={styles.playlistScroll}
            showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text
                  style={[
                    styles.loadingText,
                    { color: colors.textSecondary },
                  ]}>
                  Carregando playlists...
                </Text>
              </View>
            ) : playlists.length === 0 ? (
              <Text
                style={[styles.noPlaylistsText, { color: colors.textSecondary }]}>
                Você ainda não tem playlists criadas.
              </Text>
            ) : (
              playlists.map((playlist) => {
                const isAdding = addingToId === playlist.id;

                return (
                  <Pressable
                    key={playlist.id}
                    onPress={() => handleSelectPlaylist(playlist)}
                    disabled={isAdding}
                    style={({ pressed }) => [
                      styles.playlistRow,
                      pressed && { backgroundColor: colors.cardSecondary },
                    ]}>
                    {playlist.coverUrl ? (
                      <Image
                        source={{ uri: playlist.coverUrl }}
                        style={styles.playlistRowCover}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.playlistRowPlaceholder,
                          {
                            backgroundColor: colors.cardSecondary,
                            borderColor: colors.borderSubtle,
                          },
                        ]}>
                        <Folder size={18} color={colors.accent} />
                      </View>
                    )}

                    <View style={styles.playlistRowInfo}>
                      <Text
                        style={[
                          styles.playlistRowTitle,
                          { color: colors.text },
                        ]}
                        numberOfLines={1}>
                        {playlist.name}
                      </Text>
                      <View style={styles.privacyMiniRow}>
                        {playlist.isPublic ? (
                          <Globe size={10} color={colors.textSecondary} />
                        ) : (
                          <Lock size={10} color={colors.textSecondary} />
                        )}
                        <Text
                          style={[
                            styles.playlistRowMeta,
                            { color: colors.textSecondary },
                          ]}>
                          {playlist.isPublic ? 'Pública' : 'Privada'}
                        </Text>
                      </View>
                    </View>

                    {isAdding && (
                      <ActivityIndicator size="small" color={colors.accent} />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '75%',
  },
  modalDragPillContainer: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  modalDragPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
    maxWidth: 260,
  },
  modalCloseButton: {
    padding: 6,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  plusIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRowText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  inlineCreateBox: {
    gap: 10,
    marginBottom: 14,
  },
  inlineInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineConfirmBtn: {
    flex: 2,
    height: 40,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineBtnText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  playlistScroll: {
    maxHeight: 280,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  noPlaylistsText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingVertical: 32,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  playlistRowCover: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  playlistRowPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistRowInfo: {
    flex: 1,
    gap: 2,
  },
  playlistRowTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  privacyMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playlistRowMeta: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
});
