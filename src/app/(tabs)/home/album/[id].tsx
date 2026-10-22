import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Disc3,
  MoreVertical,
  Play,
  Share2,
  User,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TrackActionsModal from '@/components/player/track-actions-modal';
import { Fonts } from '@/constants/theme';
import { usePlayer } from '@/contexts/player-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { AlbumDetails, albumService } from '@/services/album.service';
import { Track } from '@/types/player';

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Coletânea';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Coletânea';
    return `Lançamento: ${d.toLocaleDateString('pt-BR')}`;
  } catch {
    return 'Coletânea';
  }
}

export default function AlbumDetailsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const params = useLocalSearchParams<{ id: string; title?: string }>();

  const albumId = params.id || '';
  const initialTitle = params.title
    ? decodeURIComponent(params.title).replace(/-/g, ' ')
    : 'Álbum';

  const { playList, activeTrack } = usePlayer();

  const [album, setAlbum] = useState<AlbumDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal de ações de cada faixa (3 pontos)
  const [selectedTrackForActions, setSelectedTrackForActions] =
    useState<Track | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!albumId) {
      return;
    }

    albumService
      .getAlbumById(albumId)
      .then((data) => {
        if (isMounted) {
          setAlbum(data);
          setErrorMessage(null);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.warn('Erro ao carregar álbum:', err);
          setErrorMessage(
            err?.message || 'Não foi possível carregar os detalhes do álbum.'
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [albumId]);

  const onRefresh = useCallback(async () => {
    if (!albumId) return;
    setIsRefreshing(true);
    try {
      const data = await albumService.getAlbumById(albumId);
      setAlbum(data);
      setErrorMessage(null);
    } catch (err: any) {
      console.warn('Erro ao atualizar álbum:', err);
      setErrorMessage(
        err?.message || 'Não foi possível carregar os detalhes do álbum.'
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [albumId]);

  const handlePlayAll = () => {
    if (!album || album.tracks.length === 0) return;
    playList(album.tracks, 0);
  };

  const handlePlayTrack = (track: Track, index: number) => {
    if (!album) return;
    playList(album.tracks, index);
  };

  const handleGoToArtist = () => {
    if (!album) return;
    const artistKey = album.authorId || album.authorName;
    if (artistKey && artistKey !== 'Artista Desconhecido') {
      router.push({
        pathname: '/(tabs)/home/artist/[id]' as any,
        params: { id: artistKey, name: album.authorName },
      });
    }
  };

  const handleShareAlbum = async () => {
    if (!album) return;
    try {
      await Share.share({
        message: `Ouça o álbum "${album.title}" de ${album.authorName} no IGCGMusic!`,
        title: `${album.title} | IGCGMusic`,
      });
    } catch {
      // Ignora erro de compartilhamento cancelado
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Efeito Smooth na Cor de Destaque na Parte Superior (Layout Idêntico à Tela de Curtidas e Artista) */}
      <LinearGradient
        colors={
          isDark
            ? [
                'rgba(4, 211, 97, 0.35)',
                'rgba(4, 211, 97, 0.18)',
                'rgba(93, 102, 82, 0.08)',
                'rgba(14, 21, 17, 0.02)',
                'transparent',
              ]
            : [
                'rgba(4, 211, 97, 0.22)',
                'rgba(4, 211, 97, 0.10)',
                'rgba(150, 170, 155, 0.05)',
                'transparent',
              ]
        }
        locations={[0, 0.26, 0.55, 0.8, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.ambientTopGlow}
        pointerEvents="none"
      />

      {/* Botão de Voltar e Ações do Topo Flutuantes */}
      <View
        style={[
          styles.floatingTopBar,
          {
            paddingTop: insets.top + 8,
          },
        ]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.roundIconButton,
            {
              backgroundColor: isDark
                ? 'rgba(20, 24, 22, 0.72)'
                : 'rgba(255, 255, 255, 0.85)',
              borderColor: colors.borderSubtle,
            },
            pressed && styles.buttonPressed,
          ]}>
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.4} />
        </Pressable>

        {album && (
          <Pressable
            onPress={handleShareAlbum}
            hitSlop={10}
            style={({ pressed }) => [
              styles.roundIconButton,
              {
                backgroundColor: isDark
                  ? 'rgba(20, 24, 22, 0.72)'
                  : 'rgba(255, 255, 255, 0.85)',
                borderColor: colors.borderSubtle,
              },
              pressed && styles.buttonPressed,
            ]}>
            <Share2 size={18} color={colors.text} strokeWidth={2.2} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: insets.top + 64,
            paddingBottom: insets.bottom + 120,
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
        {/* Cabeçalho do Álbum (Imagem quadrada, Centralizado) */}
        <View style={styles.albumHeader}>
          <View
            style={[
              styles.coverContainer,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.card,
              },
            ]}>
            <Image
              source={{
                uri:
                  album?.thumbnailUrl ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
              }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
            />
          </View>

          <View style={styles.albumInfoCol}>
            <Text style={[styles.albumTitle, { color: colors.text }]}>
              {album?.title || initialTitle}
            </Text>

            {Boolean(album?.authorName) && (
              <Pressable
                onPress={handleGoToArtist}
                style={({ pressed }) => [
                  styles.artistLinkRow,
                  pressed && styles.buttonPressed,
                ]}>
                <User size={14} color={colors.accent} />
                <Text style={[styles.artistLinkText, { color: colors.accent }]}>
                  {album?.authorName}
                </Text>
              </Pressable>
            )}

            {album && (
              <View
                style={[
                  styles.metaBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(4, 211, 97, 0.12)'
                      : 'rgba(4, 211, 97, 0.16)',
                  },
                ]}>
                <Text style={[styles.metaBadgeText, { color: colors.accent }]}>
                  {formatDate(album.publishedAt)} • {album.tracks.length}{' '}
                  {album.tracks.length === 1 ? 'faixa' : 'faixas'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Linha de Ações Principais (Botão "Ouvir Tudo") */}
        {album && album.tracks.length > 0 && (
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

        {/* Estado Carregando */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text
              style={[styles.loadingText, { color: colors.textSecondary }]}>
              Carregando álbum...
            </Text>
          </View>
        )}

        {/* Estado com Erro */}
        {!isLoading && errorMessage && !album && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderSubtle,
              },
            ]}>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Ops! Não foi possível carregar
            </Text>
            <Text
              style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
              {errorMessage}
            </Text>
            <Pressable
              onPress={() => onRefresh()}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: colors.accent },
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </Pressable>
          </View>
        )}

        {/* Lista de Faixas do Álbum */}
        {!isLoading && album && (
          <View style={styles.tracksSectionWrapper}>
            {album.tracks.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.borderSubtle,
                  },
                ]}>
                <Disc3 size={44} color={colors.textSecondary} />
                <Text
                  style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  Nenhuma faixa encontrada
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.textSecondary },
                  ]}>
                  As músicas deste álbum ainda estão sendo catalogadas.
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.albumSectionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.borderSubtle,
                  },
                ]}>
                <View style={styles.trackList}>
                  {album.tracks.map((track, index) => {
                    const isActive = activeTrack && activeTrack.id === track.id;

                    return (
                      <Pressable
                        key={track.id || `track-${index}`}
                        onPress={() => handlePlayTrack(track, index)}
                        style={({ pressed }) => [
                          styles.trackRow,
                          {
                            backgroundColor: isActive
                              ? isDark
                                ? 'rgba(4, 211, 97, 0.08)'
                                : 'rgba(4, 211, 97, 0.12)'
                              : 'transparent',
                            borderColor: isActive
                              ? colors.accent
                              : 'transparent',
                          },
                          pressed && styles.trackRowPressed,
                        ]}>
                        {/* Coluna Esquerda: Índice / Play / Título */}
                        <View style={styles.trackLeft}>
                          <Text
                            style={[
                              styles.trackIndex,
                              {
                                color: isActive
                                  ? colors.accent
                                  : colors.textSecondary,
                              },
                            ]}>
                            {index + 1}
                          </Text>

                          <View style={styles.trackPlayIndicator}>
                            <Play
                              size={14}
                              color={
                                isActive ? colors.accent : colors.textSecondary
                              }
                              fill={isActive ? colors.accent : 'transparent'}
                            />
                          </View>

                          <View style={styles.trackTitleCol}>
                            <Text
                              style={[
                                styles.trackTitle,
                                {
                                  color: isActive ? colors.accent : colors.text,
                                  fontFamily: isActive
                                    ? Fonts.bold
                                    : Fonts.medium,
                                },
                              ]}
                              numberOfLines={1}>
                              {track.title}
                            </Text>
                          </View>
                        </View>

                        {/* Coluna Direita: Duração e Menu de Ações (3 pontos) */}
                        <View style={styles.trackRight}>
                          <View style={styles.durationRow}>
                            <Clock size={12} color={colors.textSecondary} />
                            <Text
                              style={[
                                styles.durationText,
                                { color: colors.textSecondary },
                              ]}>
                              {formatDuration(track.duration)}
                            </Text>
                          </View>

                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTrackForActions(track);
                            }}
                            hitSlop={8}
                            style={({ pressed }) => [
                              styles.moreButton,
                              pressed && styles.buttonPressed,
                            ]}>
                            <MoreVertical
                              size={18}
                              color={colors.textSecondary}
                            />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de Ações da Faixa (Tocar agora, Adicionar à fila, Curtir, Salvar na Playlist) */}
      <TrackActionsModal
        track={selectedTrackForActions}
        visible={Boolean(selectedTrackForActions)}
        onClose={() => setSelectedTrackForActions(null)}
      />
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
    height: 440,
    zIndex: 0,
  },
  floatingTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  roundIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  albumHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
    marginBottom: 26,
  },
  coverContainer: {
    width: 140,
    height: 140,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  albumInfoCol: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  albumTitle: {
    fontSize: 28,
    fontFamily: Fonts.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
    textAlign: 'center',
  },
  artistLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  artistLinkText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  metaBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 2,
  },
  metaBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 30,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    shadowColor: '#04D361',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  playAllText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
  errorCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  errorSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    marginTop: 6,
  },
  retryButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#FFFFFF',
  },
  tracksSectionWrapper: {
    gap: 20,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    maxWidth: 280,
  },
  albumSectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  trackList: {
    gap: 2,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  trackRowPressed: {
    opacity: 0.7,
  },
  trackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  trackIndex: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    width: 18,
    textAlign: 'center',
  },
  trackPlayIndicator: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontSize: 14,
  },
  trackRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 12,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  moreButton: {
    padding: 4,
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
