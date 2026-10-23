import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Folder,
  FolderPlus,
  Globe,
  Heart,
  ListMusic,
  Lock,
  LogIn,
  Plus,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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

import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { PlaylistItem, playlistService } from '@/services/playlist.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (Math.min(SCREEN_WIDTH, 800) - 32 - 12) / 2;

function getCreatorName(creator: any): string {
  if (!creator) return 'Outro usuário';
  if (typeof creator === 'string') return creator;
  return creator.name || creator.username || 'Outro usuário';
}

export default function PlaylistsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [likedPlaylists, setLikedPlaylists] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal de Criação de Playlist
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carregamento de playlists
  useEffect(() => {
    let isMounted = true;
    if (!user) return;

    const userCacheKey = `user_playlists_${user.id}`;
    const likedCacheKey = `liked_playlists_public_${user.id}`;

    // Leitura inicial assíncrona do cache
    AsyncStorage.multiGet([userCacheKey, likedCacheKey])
      .then(([[, cachedUser], [, cachedLiked]]) => {
        if (!isMounted) return;
        if (cachedUser) {
          try {
            setPlaylists(JSON.parse(cachedUser));
          } catch {}
        }
        if (cachedLiked) {
          try {
            setLikedPlaylists(JSON.parse(cachedLiked));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        // Sincronização em segundo plano com a API
        Promise.all([
          playlistService.getUserPlaylists(user.id),
          playlistService.getLikedPlaylists(),
        ])
          .then(([userList, likedList]) => {
            if (!isMounted) return;
            setPlaylists(userList);
            setLikedPlaylists(likedList);

            AsyncStorage.multiSet([
              [userCacheKey, JSON.stringify(userList)],
              [likedCacheKey, JSON.stringify(likedList)],
            ]).catch(() => {});
          })
          .catch((err) => {
            console.warn('Falha ao sincronizar playlists da API:', err);
          })
          .finally(() => {
            if (isMounted) {
              setIsLoading(false);
            }
          });
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const [userList, likedList] = await Promise.all([
        playlistService.getUserPlaylists(user.id),
        playlistService.getLikedPlaylists(),
      ]);
      setPlaylists(userList);
      setLikedPlaylists(likedList);
      await AsyncStorage.multiSet([
        [`user_playlists_${user.id}`, JSON.stringify(userList)],
        [`liked_playlists_public_${user.id}`, JSON.stringify(likedList)],
      ]);
    } catch (err) {
      console.warn('Erro ao atualizar playlists:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  const handleOpenCreateModal = () => {
    setNewPlaylistName('');
    setIsPublic(true);
    setErrorMessage(null);
    setIsModalVisible(true);
  };

  const handleCreatePlaylist = async () => {
    const trimmedName = newPlaylistName.trim();
    if (!trimmedName) return;

    setIsCreating(true);
    setErrorMessage(null);

    try {
      const created = await playlistService.createPlaylist(trimmedName, isPublic);
      const updatedList = [created, ...playlists];
      setPlaylists(updatedList);

      if (user) {
        AsyncStorage.setItem(
          `user_playlists_${user.id}`,
          JSON.stringify(updatedList)
        ).catch(() => {});
      }

      setIsModalVisible(false);
      // Navega diretamente para a nova playlist criada
      router.push({
        pathname: '/(tabs)/playlists/[id]',
        params: { id: created.id },
      });
    } catch (err: any) {
      console.error('Erro ao criar playlist:', err);
      setErrorMessage(
        err?.message || 'Não foi possível criar a playlist. Tente novamente.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Efeito Smooth Verde no Topo (Atmospheric Accent Glow) */}
      <LinearGradient
        colors={
          isDark
            ? [
                'rgba(4, 211, 97, 0.22)',
                'rgba(4, 211, 97, 0.10)',
                'rgba(4, 211, 97, 0.03)',
                'transparent',
              ]
            : [
                'rgba(4, 211, 97, 0.18)',
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
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          ) : undefined
        }>
        {/* Cabeçalho da Tela */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Playlists
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Coleções e seleções de hinos
            </Text>
          </View>

          {isAuthenticated && (
            <Pressable
              onPress={handleOpenCreateModal}
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: colors.accent },
                pressed && styles.buttonPressed,
              ]}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Nova</Text>
            </Pressable>
          )}
        </View>

        {/* Estado Não Autenticado */}
        {!isAuthenticated && !authLoading && (
          <View
            style={[
              styles.authPromptCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderSubtle,
              },
            ]}>
            <View
              style={[
                styles.authIconCircle,
                { backgroundColor: 'rgba(4, 211, 97, 0.12)' },
              ]}>
              <ListMusic size={36} color={colors.accent} />
            </View>
            <Text
              style={[styles.authPromptTitle, { color: colors.text }]}>
              Suas Playlists Pessoais
            </Text>
            <Text
              style={[styles.authPromptText, { color: colors.textSecondary }]}>
              Entre em sua conta para criar seleções com seus hinos prediletos e
              acessar suas playlists em qualquer dispositivo.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={({ pressed }) => [
                styles.authButton,
                { backgroundColor: colors.accent },
                pressed && styles.buttonPressed,
              ]}>
              <LogIn size={18} color="#FFFFFF" />
              <Text style={styles.authButtonText}>Entrar na Minha Conta</Text>
            </Pressable>
          </View>
        )}

        {/* Estado Carregando */}
        {isAuthenticated && isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text
              style={[styles.loadingText, { color: colors.textSecondary }]}>
              Carregando playlists...
            </Text>
          </View>
        )}

        {/* Conteúdo Autenticado */}
        {isAuthenticated && !isLoading && (
          <>
            {/* Seção 1: Minhas Playlists */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Minhas Playlists
              </Text>
              {playlists.length > 0 && (
                <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                  {playlists.length}
                </Text>
              )}
            </View>

            {playlists.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.borderSubtle,
                  },
                ]}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: colors.cardSecondary },
                  ]}>
                  <FolderPlus size={32} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Você não possui playlists
                </Text>
                <Text
                  style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Crie sua primeira playlist para organizar seus hinos favoritos
                  por temas, cultos ou momentos.
                </Text>
                <Pressable
                  onPress={handleOpenCreateModal}
                  style={({ pressed }) => [
                    styles.emptyCreateButton,
                    { backgroundColor: colors.accent },
                    pressed && styles.buttonPressed,
                  ]}>
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyCreateButtonText}>
                    Criar Primeira Playlist
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {playlists.map((playlist) => (
                  <Pressable
                    key={playlist.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/playlists/[id]',
                        params: { id: playlist.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.playlistCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.borderSubtle,
                      },
                      pressed && styles.cardPressed,
                    ]}>
                    {/* Capa ou Ícone */}
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
                            ? ['#202922', '#161B22']
                            : ['#E6F7ED', '#FFFFFF']
                        }
                        style={[
                          styles.folderIconPlaceholder,
                          { borderColor: colors.borderSubtle },
                        ]}>
                        <Folder
                          size={32}
                          color={colors.accent}
                          fill={isDark ? '#04D361' : 'transparent'}
                        />
                      </LinearGradient>
                    )}

                    {/* Informações da Playlist */}
                    <View style={styles.cardInfo}>
                      <Text
                        style={[styles.cardTitle, { color: colors.text }]}
                        numberOfLines={1}>
                        {playlist.name}
                      </Text>

                      <View style={styles.cardMetaRow}>
                        {playlist.isPublic ? (
                          <View style={styles.privacyBadge}>
                            <Globe size={11} color={colors.textSecondary} />
                            <Text
                              style={[
                                styles.cardMetaText,
                                { color: colors.textSecondary },
                              ]}>
                              Pública
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.privacyBadge}>
                            <Lock size={11} color={colors.textSecondary} />
                            <Text
                              style={[
                                styles.cardMetaText,
                                { color: colors.textSecondary },
                              ]}>
                              Privada
                            </Text>
                          </View>
                        )}
                        {typeof playlist.trackCount === 'number' && (
                          <Text
                            style={[
                              styles.cardMetaText,
                              { color: colors.textSecondary },
                            ]}>
                            • {playlist.trackCount}{' '}
                            {playlist.trackCount === 1 ? 'hino' : 'hinos'}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Seção 2: Playlists Curtidas */}
            {likedPlaylists.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Playlists Curtidas
                  </Text>
                  <Text
                    style={[
                      styles.sectionCount,
                      { color: colors.textSecondary },
                    ]}>
                    {likedPlaylists.length}
                  </Text>
                </View>

                <View style={styles.gridContainer}>
                  {likedPlaylists.map((playlist) => (
                    <Pressable
                      key={playlist.id}
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/playlists/[id]',
                          params: { id: playlist.id },
                        })
                      }
                      style={({ pressed }) => [
                        styles.playlistCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.borderSubtle,
                        },
                        pressed && styles.cardPressed,
                      ]}>
                      {playlist.coverUrl ? (
                        <Image
                          source={{ uri: playlist.coverUrl }}
                          style={styles.playlistCoverImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.folderIconPlaceholder,
                            {
                              backgroundColor: 'rgba(255, 77, 109, 0.08)',
                              borderColor: 'rgba(255, 77, 109, 0.2)',
                            },
                          ]}>
                          <Heart size={32} color="#FF4D6D" fill="#FF4D6D" />
                        </View>
                      )}

                      <View style={styles.cardInfo}>
                        <Text
                          style={[styles.cardTitle, { color: colors.text }]}
                          numberOfLines={1}>
                          {playlist.name}
                        </Text>
                        <Text
                          style={[
                            styles.cardMetaText,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}>
                          Por {getCreatorName(playlist.creator)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal / Bottom Sheet de Criação de Playlist */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!isCreating) setIsModalVisible(false);
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => !isCreating && setIsModalVisible(false)}
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
            {/* Pílula decorativa */}
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
                Nova Playlist
              </Text>
              <Pressable
                onPress={() => !isCreating && setIsModalVisible(false)}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && { opacity: 0.6 },
                ]}>
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Mensagem de Erro */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {/* Input do Nome da Playlist */}
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
                placeholder="Ex: Hinos de Louvor, Culto de Domingo..."
                placeholderTextColor={colors.textSecondary}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
                editable={!isCreating}
                maxLength={60}
              />
            </View>

            {/* Switch de Privacidade (Pública / Privada) */}
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
                  {isPublic ? (
                    <Globe size={16} color={colors.accent} />
                  ) : (
                    <Lock size={16} color={colors.textSecondary} />
                  )}
                  <Text style={[styles.privacyTitle, { color: colors.text }]}>
                    {isPublic ? 'Playlist Pública' : 'Playlist Privada'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.privacySubtitle,
                    { color: colors.textSecondary },
                  ]}>
                  {isPublic
                    ? 'Qualquer irmão poderá encontrar e ouvir sua playlist.'
                    : 'Apenas você poderá ver e ouvir esta playlist.'}
                </Text>
              </View>

              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: colors.borderSubtle, true: colors.accent }}
                thumbColor="#FFFFFF"
                disabled={isCreating}
              />
            </View>

            {/* Botões de Ação */}
            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setIsModalVisible(false)}
                disabled={isCreating}
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
                onPress={handleCreatePlaylist}
                disabled={isCreating || !newPlaylistName.trim()}
                style={({ pressed }) => [
                  styles.modalConfirmButton,
                  { backgroundColor: colors.accent },
                  (!newPlaylistName.trim() || isCreating) &&
                    styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}>
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Criar Playlist</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.extraBold,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    shadowColor: '#04D361',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 13,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  playlistCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  playlistCoverImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  folderIconPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    marginTop: 6,
  },
  emptyCreateButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authPromptCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    marginTop: 10,
  },
  authIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  authPromptTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  authPromptText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    marginTop: 6,
  },
  authButtonText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
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
  errorBanner: {
    backgroundColor: '#fff0f0',
    borderColor: '#ffc9c9',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#c92a2a',
    fontFamily: Fonts.semiBold,
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
