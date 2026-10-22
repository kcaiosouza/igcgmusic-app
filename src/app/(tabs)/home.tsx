import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  Compass,
  History,
  Music,
  Play,
  RotateCw,
  Shuffle,
  Sparkles,
  Tag,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TrackActionsModal from '@/components/player/track-actions-modal';
import { NumberedTrackRow } from '@/components/track/numbered-track-row';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePlayer } from '@/contexts/player-context';
import {
  Author,
  Category,
  CuratedPlaylist,
  fetchHomeFeed,
  HomeFeedData,
} from '@/services/home.service';
import { Track } from '@/types/player';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300';

const GREETINGS = [
  'Olá,',
  'Desfrute mais um pouco,',
  'Bom ter você de volta,',
  'Que bom te ver por aqui,',
  'A comunhão fica melhor com você,',
  'Vamos desfrutar juntos,',
  'Um prazer ter você aqui,',
  'Que este momento seja especial,',
  'Aproveite este tempo,',
  'Vamos cantar ao Senhor,',
];

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatNumber(num?: number): string {
  if (!num) return '0';
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return String(num);
}

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { activeTrack, playList } = usePlayer();

  const [greeting] = useState(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllTop10, setShowAllTop10] = useState(false);
  const [selectedTrackForActions, setSelectedTrackForActions] =
    useState<Track | null>(null);

  const [feed, setFeed] = useState<HomeFeedData>({
    categories: [],
    recentTracks: [],
    catalog: [],
    recentReleases: [],
    top10: [],
    curatedPlaylists: [],
    popularDownloads: [],
    topArtists: [],
  });

  // Previne botão nativo voltar do Android de sair do app na home
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true
      );
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    let isMounted = true;
    fetchHomeFeed()
      .then((data) => {
        if (isMounted) {
          setFeed(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar Home:', err);
        if (isMounted) {
          setError('Não foi possível carregar os hinos. Puxe para tentar novamente.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchHomeFeed();
      setFeed(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao recarregar Home:', err);
      setError('Não foi possível carregar os hinos. Puxe para tentar novamente.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHomeFeed();
      setFeed(data);
    } catch (err) {
      console.error('Erro ao recarregar Home:', err);
      setError('Não foi possível carregar os hinos. Puxe para tentar novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tocar uma faixa específica dentro de uma lista (estabelece a fila)
  const handlePlayTrack = (track: Track, list: Track[]) => {
    const idx = list.findIndex((t) => t.id === track.id);
    if (idx !== -1) {
      playList(list, idx);
    } else {
      playList([track, ...list], 0);
    }
  };

  // Tocar Mix Personalizado
  const handlePlayMix = () => {
    if (!feed.catalog.length) return;
    const shuffled = [...feed.catalog].sort(() => Math.random() - 0.5);
    playList(shuffled.slice(0, 30), 0);
  };

  // Abrir tela da Playlist ao clicar
  const handlePlaylistClick = (playlist: CuratedPlaylist) => {
    if (!playlist?.id) return;
    router.push({
      pathname: '/(tabs)/playlists/[id]',
      params: { id: playlist.id, from: 'home' },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header Superior da Home */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
              {greeting}
            </Text>
            <Text style={[styles.greetingName, { color: colors.text }]}>
              {user?.name || user?.username || 'Irmão(ã)'}
            </Text>
          </View>
          <View style={styles.headerRightBadge}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.brandLogoCircle}
              contentFit="cover"
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Carregando hinos e louvores...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error}
            </Text>
            <Pressable
              onPress={handleRetry}
              style={[styles.retryButton, { backgroundColor: colors.accent }]}>
              <RotateCw size={16} color="#0D1117" />
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }>
            {/* 1. Categorias (se houver) */}
            {feed.categories.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Tag size={18} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Categorias
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScroll}>
                  {feed.categories.map((cat: Category) => (
                    <View
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.borderSubtle,
                        },
                      ]}>
                      <Text style={[styles.categoryText, { color: colors.text }]}>
                        {cat.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* 2. Ouça Novamente (se houver histórico) */}
            {feed.recentTracks.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <History size={18} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Ouça novamente
                  </Text>
                </View>
                <View style={styles.tracksVerticalList}>
                  {feed.recentTracks.map((track) => {
                    const isCurrent = activeTrack?.id === track.id;
                    return (
                      <Pressable
                        key={track.id}
                        onPress={() => handlePlayTrack(track, feed.recentTracks)}
                        onLongPress={() => setSelectedTrackForActions(track)}
                        style={({ pressed }) => [
                          styles.compactTrackItem,
                          {
                            backgroundColor: colors.card,
                            borderColor: isCurrent
                              ? colors.accent
                              : colors.borderSubtle,
                          },
                          pressed && styles.itemPressed,
                        ]}>
                        <Image
                          source={{ uri: track.thumbnail || DEFAULT_COVER }}
                          style={styles.compactTrackImg}
                          contentFit="cover"
                        />
                        <View style={styles.compactTrackInfo}>
                          <Text
                            style={[
                              styles.trackTitle,
                              {
                                color: isCurrent ? colors.accent : colors.text,
                              },
                            ]}
                            numberOfLines={1}>
                            {track.title}
                          </Text>
                          <Text
                            style={[
                              styles.trackArtist,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}>
                            {track.members}
                          </Text>
                        </View>
                        <View style={styles.trackRightAction}>
                          <Text
                            style={[
                              styles.durationText,
                              { color: colors.textSecondary },
                            ]}>
                            {formatDuration(track.duration)}
                          </Text>
                          <View
                            style={[
                              styles.miniPlayIconCircle,
                              {
                                backgroundColor: isCurrent
                                  ? colors.accent
                                  : colors.borderSubtle,
                              },
                            ]}>
                            <Play
                              size={12}
                              color={isCurrent ? '#0D1117' : colors.text}
                              fill={isCurrent ? '#0D1117' : colors.text}
                              style={{ marginLeft: 1 }}
                            />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* 3. Seção Mix Personalizado */}
            {feed.catalog.length > 0 ? (
              <View
                style={[
                  styles.mixBanner,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.borderSubtle,
                  },
                ]}>
                <View style={styles.mixInfo}>
                  <View style={styles.mixTitleRow}>
                    <Shuffle size={20} color={colors.accent} />
                    <Text style={[styles.mixTitleText, { color: colors.text }]}>
                      Mix Personalizado
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.mixSubtitleText,
                      { color: colors.textSecondary },
                    ]}>
                    Sua seleção está pronta. Descubra hinos recomendados com
                    base no que você mais ouve e desfrute de uma experiência
                    feita para o seu gosto.
                  </Text>
                </View>

                <Pressable
                  onPress={handlePlayMix}
                  style={({ pressed }) => [
                    styles.mixPlayButton,
                    pressed && styles.itemPressed,
                  ]}>
                  <LinearGradient
                    colors={[colors.accent, '#028E41']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mixPlayGradient}>
                    <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.mixPlayButtonText}>Tocar Mix</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : null}

            {/* 4. Recomendado para você */}
            {feed.catalog.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Music size={18} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Recomendado para você
                  </Text>
                </View>

                <View style={styles.tracksVerticalList}>
                  {feed.catalog.slice(0, 5).map((track, idx) => (
                    <NumberedTrackRow
                      key={track.id}
                      track={track}
                      index={idx}
                      isCurrent={activeTrack?.id === track.id}
                      onPress={() =>
                        handlePlayTrack(track, feed.catalog.slice(0, 10))
                      }
                      onLongPress={() => setSelectedTrackForActions(track)}
                      onMorePress={() => setSelectedTrackForActions(track)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* 5. Lançamentos Recentes */}
            {feed.recentReleases.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Sparkles size={18} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Lançamentos recentes
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalCardsScroll}>
                  {feed.recentReleases.map((track) => (
                    <Pressable
                      key={track.id}
                      onPress={() =>
                        handlePlayTrack(track, feed.recentReleases)
                      }
                      onLongPress={() => setSelectedTrackForActions(track)}
                      style={({ pressed }) => [
                        styles.hCard,
                        { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                        pressed && styles.itemPressed,
                      ]}>
                      <Image
                        source={{ uri: track.thumbnail || DEFAULT_COVER }}
                        style={styles.hCardImage}
                        contentFit="cover"
                      />
                      <Text
                        style={[styles.hCardTitle, { color: colors.text }]}
                        numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text
                        style={[
                          styles.hCardSubtitle,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}>
                        {track.members}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* 6. Top 10 de hoje */}
            {feed.top10.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderBetween}>
                  <View style={styles.sectionHeaderRow}>
                    <TrendingUp size={18} color={colors.accent} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Top 10 de hoje
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setShowAllTop10(!showAllTop10)}
                    hitSlop={8}>
                    <Text style={[styles.seeAllText, { color: colors.accent }]}>
                      {showAllTop10 ? 'Exibir menos' : 'Exibir todos'}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.tracksVerticalList}>
                  {feed.top10
                    .slice(0, showAllTop10 ? 10 : 3)
                    .map((track, idx) => (
                      <NumberedTrackRow
                        key={track.id}
                        track={track}
                        index={idx}
                        isCurrent={activeTrack?.id === track.id}
                        onPress={() => handlePlayTrack(track, feed.top10)}
                        onLongPress={() => setSelectedTrackForActions(track)}
                        onMorePress={() => setSelectedTrackForActions(track)}
                      />
                    ))}
                </View>
              </View>
            ) : null}

            {/* 7. Playlists recomendadas */}
            {feed.curatedPlaylists.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Compass size={18} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Playlists recomendadas
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalCardsScroll}>
                  {feed.curatedPlaylists.map((playlist) => (
                    <Pressable
                      key={playlist.id}
                      onPress={() => handlePlaylistClick(playlist)}
                      style={({ pressed }) => [
                        styles.hCard,
                        { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                        pressed && styles.itemPressed,
                      ]}>
                      <Image
                        source={{ uri: playlist.coverUrl || DEFAULT_COVER }}
                        style={styles.hCardImage}
                        contentFit="cover"
                      />
                      <Text
                        style={[styles.hCardTitle, { color: colors.text }]}
                        numberOfLines={1}>
                        {playlist.name}
                      </Text>
                      <Text
                        style={[
                          styles.hCardSubtitle,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}>
                        {playlist.trackCount || 0} música(s)
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* 8. Mais baixados da semana */}
            {feed.popularDownloads.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Trophy size={18} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Mais baixados da semana
                  </Text>
                </View>
                <View style={styles.tracksVerticalList}>
                  {feed.popularDownloads.slice(0, 5).map((track, idx) => (
                    <NumberedTrackRow
                      key={track.id}
                      track={track}
                      index={idx}
                      isCurrent={activeTrack?.id === track.id}
                      onPress={() =>
                        handlePlayTrack(track, feed.popularDownloads)
                      }
                      onLongPress={() => setSelectedTrackForActions(track)}
                      onMorePress={() => setSelectedTrackForActions(track)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* 9. Top Artistas */}
            {feed.topArtists.length > 0 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Users size={18} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Top Artistas
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalCardsScroll}>
                  {feed.topArtists.slice(0, 10).map((artist: Author) => (
                    <View
                      key={artist.id}
                      style={[
                        styles.artistCard,
                        { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                      ]}>
                      <Image
                        source={{ uri: artist.avatarUrl || DEFAULT_COVER }}
                        style={styles.artistAvatar}
                        contentFit="cover"
                      />
                      <Text
                        style={[styles.artistName, { color: colors.text }]}
                        numberOfLines={1}>
                        {artist.name}
                      </Text>
                      <Text
                        style={[
                          styles.artistSub,
                          { color: colors.textSecondary },
                        ]}
                        numberOfLines={1}>
                        {formatNumber(artist.listeners)} ouvintes
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Modal de Opções e Fila de Faixa */}
      <TrackActionsModal
        track={selectedTrackForActions}
        visible={selectedTrackForActions !== null}
        onClose={() => setSelectedTrackForActions(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greetingSub: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  greetingName: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    letterSpacing: -0.3,
    marginTop: 1,
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130, // Espaço para o mini player fixado sobre a tab bar
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  retryButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#0D1117',
  },
  sectionContainer: {
    marginBottom: 26,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  categoriesScroll: {
    gap: 10,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  tracksVerticalList: {
    gap: 10,
  },
  compactTrackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  compactTrackImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1E201C',
  },
  compactTrackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  trackArtist: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  trackRightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  miniPlayIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixBanner: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 26,
    gap: 16,
  },
  mixInfo: {
    gap: 6,
  },
  mixTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mixTitleText: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  mixSubtitleText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  mixPlayButton: {
    borderRadius: 9999,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  mixPlayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  mixPlayButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  horizontalCardsScroll: {
    gap: 14,
    paddingRight: 20,
  },
  hCard: {
    width: 140,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  hCardImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#1E201C',
    marginBottom: 8,
  },
  hCardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  hCardSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  artistCard: {
    width: 110,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  artistAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1E201C',
    marginBottom: 8,
  },
  artistName: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    textAlign: 'center',
  },
  artistSub: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  itemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
