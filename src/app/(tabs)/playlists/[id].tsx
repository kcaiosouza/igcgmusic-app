import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Globe,
  Heart,
  ListMusic,
  Lock,
  Pencil,
  Play,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TrackActionsModal from '@/components/player/track-actions-modal';
import DraggableTrackList from '@/components/track/draggable-track-list';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePlayer } from '@/contexts/player-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { PlaylistDetails, playlistService } from '@/services/playlist.service';
import { Track } from '@/types/player';

export default function PlaylistDetailsScreen() {
  const { id: rawId, from } = useLocalSearchParams<{
    id: string | string[];
    from?: string;
  }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { user } = useAuth();
  const { playList, activeTrack } = usePlayer();
  const navigation = useNavigation();

  const handleGoBack = useCallback(() => {
    if (from === 'search' || from === 'home' || from === 'favorites') {
      try {
        (navigation as any).reset({
          index: 0,
          routes: [{ name: 'index' }],
        });
      } catch {
        if (router.canDismiss()) {
          router.dismissAll();
        } else if (router.canGoBack()) {
          router.back();
        }
      }
      router.replace(`/(tabs)/${from}` as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/playlists');
    }
  }, [from, navigation]);

  useEffect(() => {
    if (!from) return;

    const onBackPress = () => {
      handleGoBack();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => subscription.remove();
  }, [from, handleGoBack]);

  const [playlist, setPlaylist] = useState<PlaylistDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [selectedTrackForActions, setSelectedTrackForActions] =
    useState<Track | null>(null);

  // Modal de Edição (Nome e Privacidade)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Toast de feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    playlistService
      .getPlaylistDetails(id)
      .then((data) => {
        if (isMounted) {
          setPlaylist(data);
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar detalhes da playlist:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const onRefresh = useCallback(async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      const data = await playlistService.getPlaylistDetails(id);
      setPlaylist(data);
    } catch (err: any) {
      console.warn('Erro ao atualizar detalhes da playlist:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [id]);

  const isOwner = user?.id && playlist?.userId === user.id;

  const handlePlayAll = () => {
    if (playlist && playlist.tracks.length > 0) {
      playList(playlist.tracks, 0);
    }
  };

  const handlePlayTrack = (track: Track, index: number) => {
    if (playlist) {
      playList(playlist.tracks, index);
    }
  };

  const handleReorderTracks = async (newTracks: Track[]) => {
    if (!playlist) return;
    const previous = playlist;
    setPlaylist({ ...playlist, tracks: newTracks });

    try {
      await playlistService.reorderPlaylistTracks(
        playlist.id,
        newTracks.map((t) => t.id)
      );
    } catch (err) {
      console.warn('Erro ao reordenar faixas da playlist:', err);
      setPlaylist(previous);
      showToast('Não foi possível salvar a nova ordem.');
    }
  };

  const handleToggleLike = async () => {
    if (!playlist) return;
    const currentlyLiked = playlist.isLiked;
    setPlaylist({ ...playlist, isLiked: !currentlyLiked });

    try {
      if (currentlyLiked) {
        await playlistService.unlikePlaylist(playlist.id);
        showToast('Removido das playlists curtidas');
      } else {
        await playlistService.likePlaylist(playlist.id);
        showToast('Playlist adicionada aos seus favoritos');
      }
    } catch (err) {
      console.warn('Erro ao curtir/descurtir playlist:', err);
      setPlaylist({ ...playlist, isLiked: currentlyLiked });
    }
  };

  const handleOpenEditModal = () => {
    if (!playlist) return;
    setEditName(playlist.name);
    setEditIsPublic(playlist.isPublic);
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!playlist || !editName.trim()) return;
    setIsSavingEdit(true);

    try {
      await playlistService.updatePlaylist(playlist.id, {
        name: editName.trim(),
        isPublic: editIsPublic,
      });

      setPlaylist({
        ...playlist,
        name: editName.trim(),
        isPublic: editIsPublic,
      });

      setIsEditModalVisible(false);
      showToast('Playlist atualizada com sucesso!');
    } catch (err) {
      console.warn('Erro ao atualizar playlist:', err);
      Alert.alert('Erro', 'Não foi possível salvar as alterações da playlist.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePlaylist = () => {
    if (!playlist) return;

    Alert.alert(
      'Excluir Playlist',
      `Tem certeza que deseja excluir "${playlist.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await playlistService.deletePlaylist(playlist.id);
              handleGoBack();
            } catch (err) {
              console.warn('Erro ao excluir playlist:', err);
              Alert.alert('Erro', 'Não foi possível excluir a playlist.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando playlist...
          </Text>
        </View>
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.contentContainer, { paddingTop: insets.top + 20 }]}>
          <Pressable
            onPress={handleGoBack}
            style={styles.backButton}>
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <View style={styles.centerLoading}>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Playlist não encontrada
            </Text>
            <Text
              style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
              Esta playlist pode ter sido excluída ou é privada.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Efeito Smooth Verde no Topo */}
      <LinearGradient
        colors={
          isDark
            ? [
                'rgba(4, 211, 97, 0.25)',
                'rgba(4, 211, 97, 0.12)',
                'rgba(4, 211, 97, 0.03)',
                'transparent',
              ]
            : [
                'rgba(4, 211, 97, 0.20)',
                'rgba(4, 211, 97, 0.08)',
                'rgba(4, 211, 97, 0.02)',
                'transparent',
              ]
        }
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.ambientTopGlow}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scrollView}
        scrollEnabled={!isDraggingItem}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }>
        {/* Barra Superior de Navegação */}
        <View style={styles.topBar}>
          <Pressable
            onPress={handleGoBack}
            hitSlop={10}
            style={({ pressed }) => [
              styles.navIconButton,
              { backgroundColor: colors.cardSecondary },
              pressed && styles.buttonPressed,
            ]}>
            <ArrowLeft size={18} color={colors.text} />
          </Pressable>

          <View style={styles.topBarRight}>
            {isOwner && (
              <>
                <Pressable
                  onPress={handleOpenEditModal}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.navIconButton,
                    { backgroundColor: colors.cardSecondary },
                    pressed && styles.buttonPressed,
                  ]}>
                  <Pencil size={16} color={colors.text} />
                </Pressable>
                <Pressable
                  onPress={handleDeletePlaylist}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.navIconButton,
                    { backgroundColor: 'rgba(255, 77, 77, 0.12)' },
                    pressed && styles.buttonPressed,
                  ]}>
                  <Trash2 size={16} color="#FF4D4D" />
                </Pressable>
              </>
            )}

            {!isOwner && (
              <Pressable
                onPress={handleToggleLike}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.navIconButton,
                  {
                    backgroundColor: playlist.isLiked
                      ? 'rgba(255, 77, 109, 0.15)'
                      : colors.cardSecondary,
                  },
                  pressed && styles.buttonPressed,
                ]}>
                <Heart
                  size={18}
                  color={playlist.isLiked ? '#FF4D6D' : colors.text}
                  fill={playlist.isLiked ? '#FF4D6D' : 'transparent'}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Cabeçalho com Capa e Detalhes */}
        <View style={styles.playlistHeader}>
          {playlist.coverUrl ? (
            <Image
              source={{ uri: playlist.coverUrl }}
              style={styles.playlistCoverImage}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={
                isDark
                  ? ['#1C3A27', '#0F2015']
                  : ['#D2F4E1', '#E6F7ED']
              }
              style={[
                styles.playlistCoverPlaceholder,
                { borderColor: colors.borderSubtle },
              ]}>
              <ListMusic size={60} color={colors.accent} />
            </LinearGradient>
          )}

          <View style={styles.playlistInfo}>
            <View style={styles.tagRow}>
              {playlist.isPublic ? (
                <View style={styles.tagBadge}>
                  <Globe size={11} color={colors.accent} />
                  <Text style={[styles.tagBadgeText, { color: colors.accent }]}>
                    PLAYLIST PÚBLICA
                  </Text>
                </View>
              ) : (
                <View style={styles.tagBadge}>
                  <Lock size={11} color={colors.textSecondary} />
                  <Text
                    style={[
                      styles.tagBadgeText,
                      { color: colors.textSecondary },
                    ]}>
                    PLAYLIST PRIVADA
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.playlistTitle, { color: colors.text }]}>
              {playlist.name}
            </Text>

            <Text
              style={[styles.playlistMeta, { color: colors.textSecondary }]}>
              {playlist.tracks.length}{' '}
              {playlist.tracks.length === 1 ? 'música' : 'músicas'}
              {playlist.creator?.name
                ? ` • Por ${playlist.creator.name}`
                : isOwner
                  ? ' • Sua autoria'
                  : ''}
            </Text>
          </View>
        </View>

        {/* Botão de Reprodução "Ouvir Tudo" */}
        {playlist.tracks.length > 0 && (
          <View style={styles.actionRow}>
            <Pressable
              onPress={handlePlayAll}
              style={({ pressed }) => [
                styles.playAllButton,
                { backgroundColor: colors.accent },
                pressed && styles.buttonPressed,
              ]}>
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.playAllText}>Ouvir Tudo</Text>
            </Pressable>
          </View>
        )}

        {/* Lista de Hinos com Reordenação Draggable */}
        {playlist.tracks.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderSubtle,
              },
            ]}>
            <ListMusic size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Esta playlist ainda está vazia
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Adicione hinos a esta playlist através do menu (3 pontos) de
              qualquer hino no aplicativo.
            </Text>
          </View>
        ) : (
          <DraggableTrackList
            tracks={playlist.tracks}
            activeTrackId={activeTrack?.id}
            onPlayTrack={handlePlayTrack}
            onMorePress={setSelectedTrackForActions}
            onReorder={handleReorderTracks}
            onDragStateChange={setIsDraggingItem}
          />
        )}
      </ScrollView>

      {/* Toast Flutuante de Notificação */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <View
            style={[
              styles.toastPill,
              {
                backgroundColor: colors.card,
                borderColor: colors.accent,
              },
            ]}>
            <Check size={16} color={colors.accent} />
            <Text style={[styles.toastText, { color: colors.text }]}>
              {toastMessage}
            </Text>
          </View>
        </View>
      )}

      {/* Modal de Ações da Faixa */}
      <TrackActionsModal
        track={selectedTrackForActions}
        visible={!!selectedTrackForActions}
        onClose={() => setSelectedTrackForActions(null)}
      />

      {/* Modal de Edição da Playlist (Nome e Privacidade) */}
      <Modal
        visible={isEditModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!isSavingEdit) setIsEditModalVisible(false);
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => !isSavingEdit && setIsEditModalVisible(false)}
          />

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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Editar Playlist
              </Text>
              <Pressable
                onPress={() => !isSavingEdit && setIsEditModalVisible(false)}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && { opacity: 0.6 },
                ]}>
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                NOME DA PLAYLIST
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.cardSecondary,
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nome da playlist"
                placeholderTextColor={colors.textSecondary}
                editable={!isSavingEdit}
                maxLength={60}
              />
            </View>

            <View
              style={[
                styles.privacyRow,
                {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.borderSubtle,
                },
              ]}>
              <View style={styles.privacyTextCol}>
                <View style={styles.privacyHeader}>
                  {editIsPublic ? (
                    <Globe size={16} color={colors.accent} />
                  ) : (
                    <Lock size={16} color={colors.textSecondary} />
                  )}
                  <Text style={[styles.privacyTitle, { color: colors.text }]}>
                    {editIsPublic ? 'Playlist Pública' : 'Playlist Privada'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.privacySubtitle,
                    { color: colors.textSecondary },
                  ]}>
                  {editIsPublic
                    ? 'Qualquer irmão poderá encontrar e ouvir sua playlist.'
                    : 'Apenas você poderá ver e ouvir esta playlist.'}
                </Text>
              </View>

              <Switch
                value={editIsPublic}
                onValueChange={setEditIsPublic}
                trackColor={{ false: colors.borderSubtle, true: colors.accent }}
                thumbColor="#FFFFFF"
                disabled={isSavingEdit}
              />
            </View>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSavingEdit}
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  { borderColor: colors.borderSubtle },
                  pressed && styles.buttonPressed,
                ]}>
                <Text
                  style={[
                    styles.modalCancelButtonText,
                    { color: colors.textSecondary },
                  ]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveEdit}
                disabled={isSavingEdit || !editName.trim()}
                style={({ pressed }) => [
                  styles.modalConfirmButton,
                  { backgroundColor: colors.accent },
                  (!editName.trim() || isSavingEdit) && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}>
                {isSavingEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Salvar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  ambientTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    position: 'relative',
    zIndex: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  errorSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playlistHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
    marginBottom: 24,
  },
  playlistCoverImage: {
    width: 140,
    height: 140,
    borderRadius: 24,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  playlistCoverPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  playlistInfo: {
    alignItems: 'center',
    gap: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    letterSpacing: 1,
  },
  playlistTitle: {
    fontSize: 26,
    fontFamily: Fonts.extraBold,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  playlistMeta: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 50,
    shadowColor: '#04D361',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  playAllText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 6,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  privacyTextCol: {
    flex: 1,
    gap: 4,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  privacySubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    lineHeight: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  modalConfirmButton: {
    flex: 2,
    height: 46,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#04D361',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  modalConfirmButtonText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
