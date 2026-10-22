import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  BookOpen,
  Clock,
  Compass,
  Disc,
  Heart,
  Music,
  Search as SearchIcon,
  Smile,
  Sparkles,
  Users,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TrackActionsModal from '@/components/player/track-actions-modal';
import { NumberedTrackRow } from '@/components/track/numbered-track-row';
import { Colors, Fonts } from '@/constants/theme';
import { usePlayer } from '@/contexts/player-context';
import { useTheme } from '@/hooks/use-theme';
import {
  clearRecentSearches,
  DEFAULT_EXPLORE_CATEGORIES,
  ExploreCategory,
  getRecentSearches,
  removeRecentSearch,
  saveRecentSearch,
  SearchAlbum,
  SearchArtist,
  SearchPlaylist,
  SearchResults,
  searchContent,
} from '@/services/search.service';
import { Track } from '@/types/player';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300';
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150';

type SearchTab = 'all' | 'tracks' | 'albums' | 'artists' | 'playlists';

function renderCategoryIcon(name: string, color: string) {
  switch (name) {
    case 'Heart':
      return <Heart size={20} color={color} />;
    case 'BookOpen':
      return <BookOpen size={20} color={color} />;
    case 'Users':
      return <Users size={20} color={color} />;
    case 'Sparkles':
      return <Sparkles size={20} color={color} />;
    case 'Music':
      return <Music size={20} color={color} />;
    case 'Disc':
      return <Disc size={20} color={color} />;
    case 'Smile':
      return <Smile size={20} color={color} />;
    default:
      return <Compass size={20} color={color} />;
  }
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { activeTrack, playList } = usePlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedTrackForActions, setSelectedTrackForActions] =
    useState<Track | null>(null);

  const [results, setResults] = useState<SearchResults>({
    tracks: [],
    albums: [],
    artists: [],
    playlists: [],
  });

  // Carrega histórico salvo localmente
  useEffect(() => {
    let isMounted = true;
    getRecentSearches().then((list) => {
      if (isMounted) setRecentSearches(list);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Debounce do input em 300ms conforme a versão web
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Executa busca sempre que debouncedQuery mudar
  useEffect(() => {
    let isActive = true;
    const query = debouncedQuery.trim();

    if (query.length >= 3) {
      Promise.resolve().then(() => {
        if (isActive) {
          setIsLoading(true);
          setActiveTab('all');
        }
      });

      searchContent(query)
        .then((res) => {
          if (isActive) {
            setResults(res);
          }
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false);
          }
        });
    } else {
      Promise.resolve().then(() => {
        if (isActive) {
          setResults({ tracks: [], albums: [], artists: [], playlists: [] });
          setIsLoading(false);
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [debouncedQuery]);

  const handleSelectRecent = (term: string) => {
    Keyboard.dismiss();
    setSearchQuery(term);
    setDebouncedQuery(term);
  };

  const handleRemoveRecent = async (term: string) => {
    const updated = await removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const handlePlayTrack = useCallback(
    (track: Track, list: Track[]) => {
      saveRecentSearch(debouncedQuery).then(setRecentSearches);
      const idx = list.findIndex((t) => t.id === track.id);
      if (idx !== -1) {
        playList(list, idx);
      } else {
        playList([track, ...list], 0);
      }
    },
    [debouncedQuery, playList]
  );

  const handleCategoryPress = (category: ExploreCategory) => {
    Keyboard.dismiss();
    setSearchQuery(category.slug);
    setDebouncedQuery(category.slug);
  };

  const hasTracks = results.tracks.length > 0;
  const hasAlbums = results.albums.length > 0;
  const hasArtists = results.artists.length > 0;
  const hasPlaylists = results.playlists.length > 0;
  const hasAnyResults = hasTracks || hasAlbums || hasArtists || hasPlaylists;
  const isQueryTooShort = searchQuery.trim().length > 0 && searchQuery.trim().length < 3;
  const isQueryEmpty = searchQuery.trim().length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + 12,
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>
          Pesquisa
        </Text>

        {/* Input Bar com ícone e botão limpar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.cardSecondary,
              borderColor: theme.border,
            },
          ]}>
          <SearchIcon size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Buscar hinos, cantores, álbuns..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.clearInputButton}>
              <X size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Abas / Filtros de Resultados */}
        {!isQueryEmpty && !isQueryTooShort && hasAnyResults && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}>
            <Pressable
              onPress={() => setActiveTab('all')}
              style={[
                styles.tabPill,
                activeTab === 'all'
                  ? { backgroundColor: Colors.dark.accent }
                  : { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <Text
                style={[
                  styles.tabPillText,
                  {
                    color:
                      activeTab === 'all'
                        ? '#03200E'
                        : theme.textSecondary,
                  },
                ]}>
                Tudo
              </Text>
            </Pressable>

            {hasTracks && (
              <Pressable
                onPress={() => setActiveTab('tracks')}
                style={[
                  styles.tabPill,
                  activeTab === 'tracks'
                    ? { backgroundColor: Colors.dark.accent }
                    : { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color:
                        activeTab === 'tracks'
                          ? '#03200E'
                          : theme.textSecondary,
                    },
                  ]}>
                  Hinos ({results.tracks.length})
                </Text>
              </Pressable>
            )}

            {hasAlbums && (
              <Pressable
                onPress={() => setActiveTab('albums')}
                style={[
                  styles.tabPill,
                  activeTab === 'albums'
                    ? { backgroundColor: Colors.dark.accent }
                    : { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color:
                        activeTab === 'albums'
                          ? '#03200E'
                          : theme.textSecondary,
                    },
                  ]}>
                  Álbuns ({results.albums.length})
                </Text>
              </Pressable>
            )}

            {hasArtists && (
              <Pressable
                onPress={() => setActiveTab('artists')}
                style={[
                  styles.tabPill,
                  activeTab === 'artists'
                    ? { backgroundColor: Colors.dark.accent }
                    : { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color:
                        activeTab === 'artists'
                          ? '#03200E'
                          : theme.textSecondary,
                    },
                  ]}>
                  Artistas ({results.artists.length})
                </Text>
              </Pressable>
            )}

            {hasPlaylists && (
              <Pressable
                onPress={() => setActiveTab('playlists')}
                style={[
                  styles.tabPill,
                  activeTab === 'playlists'
                    ? { backgroundColor: Colors.dark.accent }
                    : { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color:
                        activeTab === 'playlists'
                          ? '#03200E'
                          : theme.textSecondary,
                    },
                  ]}>
                  Playlists ({results.playlists.length})
                </Text>
              </Pressable>
            )}
          </ScrollView>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Loading Indicator */}
        {isLoading ? (
          <View style={styles.centerMessageContainer}>
            <ActivityIndicator size="large" color={Colors.dark.accent} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Buscando no acervo do IGCG...
            </Text>
          </View>
        ) : isQueryTooShort ? (
          /* Aviso de digitação curta */
          <View style={styles.centerMessageContainer}>
            <SearchIcon size={32} color={theme.textSecondary} />
            <Text style={[styles.infoMessageText, { color: theme.textSecondary }]}>
              Digite pelo menos 3 caracteres para buscar hinos, álbuns e cantores.
            </Text>
          </View>
        ) : !isQueryEmpty && !hasAnyResults ? (
          /* Nenhum resultado */
          <View style={styles.centerMessageContainer}>
            <SearchIcon size={36} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Nenhum resultado encontrado
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {`Não encontramos nenhum item correspondente a "${debouncedQuery}". Tente pesquisar com outras palavras.`}
            </Text>
          </View>
        ) : isQueryEmpty ? (
          /* EXPLORER & HISTÓRICO QUANDO BUSCA VAZIA */
          <View style={styles.exploreSection}>
            {/* Histórico Recente */}
            {recentSearches.length > 0 && (
              <View style={styles.recentHistoryBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Buscas Recentes
                  </Text>
                  <Pressable onPress={handleClearAllRecent} hitSlop={8}>
                    <Text
                      style={[styles.clearAllText, { color: Colors.dark.accent }]}>
                      Limpar tudo
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.chipsWrap}>
                  {recentSearches.map((term) => (
                    <Pressable
                      key={term}
                      onPress={() => handleSelectRecent(term)}
                      style={[
                        styles.recentChip,
                        {
                          backgroundColor: theme.cardSecondary,
                          borderColor: theme.border,
                        },
                      ]}>
                      <Clock size={12} color={theme.textSecondary} />
                      <Text
                        style={[styles.recentChipText, { color: theme.text }]}
                        numberOfLines={1}>
                        {term}
                      </Text>
                      <Pressable
                        onPress={() => handleRemoveRecent(term)}
                        hitSlop={8}
                        style={styles.chipRemoveBtn}>
                        <X size={12} color={theme.textSecondary} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Explorar Categorias e Estilos de Louvor */}
            <View style={styles.exploreCategoriesBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Explorar Estilos & Hinos
                </Text>
              </View>

              <View style={styles.categoriesGrid}>
                {DEFAULT_EXPLORE_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => handleCategoryPress(cat)}
                    style={({ pressed }) => [
                      styles.categoryCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                      pressed && styles.cardPressed,
                    ]}>
                    <View
                      style={[
                        styles.categoryIconCircle,
                        { backgroundColor: `${cat.color}1F` },
                      ]}>
                      {renderCategoryIcon(cat.iconName, cat.color)}
                    </View>
                    <Text
                      style={[styles.categoryCardName, { color: theme.text }]}
                      numberOfLines={2}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* RESULTADOS DE BUSCA ATIVOS */
          <View style={styles.resultsContainer}>
            {/* 1. SEÇÃO DE HINOS (COMPONENTIZADO) */}
            {hasTracks && (activeTab === 'all' || activeTab === 'tracks') && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Hinos
                  </Text>
                  {activeTab === 'all' && results.tracks.length > 5 && (
                    <Pressable
                      onPress={() => setActiveTab('tracks')}
                      hitSlop={8}>
                      <Text
                        style={[
                          styles.seeAllLink,
                          { color: Colors.dark.accent },
                        ]}>
                        Ver todos ({results.tracks.length})
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.tracksVerticalList}>
                  {(activeTab === 'all'
                    ? results.tracks.slice(0, 5)
                    : results.tracks
                  ).map((track, idx) => (
                    <NumberedTrackRow
                      key={track.id}
                      track={track}
                      index={idx}
                      isCurrent={activeTrack?.id === track.id}
                      onPress={() =>
                        handlePlayTrack(track, results.tracks)
                      }
                      onLongPress={() => setSelectedTrackForActions(track)}
                      onMorePress={() => setSelectedTrackForActions(track)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* 2. SEÇÃO DE ÁLBUNS */}
            {hasAlbums && (activeTab === 'all' || activeTab === 'albums') && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Álbuns
                  </Text>
                  {activeTab === 'all' && results.albums.length > 4 && (
                    <Pressable
                      onPress={() => setActiveTab('albums')}
                      hitSlop={8}>
                      <Text
                        style={[
                          styles.seeAllLink,
                          { color: Colors.dark.accent },
                        ]}>
                        Ver todos ({results.albums.length})
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.albumsGrid}>
                  {(activeTab === 'all'
                    ? results.albums.slice(0, 4)
                    : results.albums
                  ).map((album: SearchAlbum) => (
                    <Pressable
                      key={album.id}
                      onPress={() => {
                        if (!album.id) return;
                        router.push({
                          pathname: '/(tabs)/home/album/[id]' as any,
                          params: { id: album.id, title: album.title },
                        });
                      }}
                      style={({ pressed }) => [
                        styles.albumCard,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                        pressed && styles.cardPressed,
                      ]}>
                      <Image
                        source={{ uri: album.thumbnailUrl || DEFAULT_COVER }}
                        style={styles.albumCover}
                        contentFit="cover"
                      />
                      <Text
                        style={[styles.albumTitle, { color: theme.text }]}
                        numberOfLines={1}>
                        {album.title}
                      </Text>
                      <Text
                        style={[
                          styles.albumArtist,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={1}>
                        {album.authorName || album.members || 'Artista IGCG'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* 3. SEÇÃO DE ARTISTAS */}
            {hasArtists && (activeTab === 'all' || activeTab === 'artists') && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Artistas & Cantores
                  </Text>
                  {activeTab === 'all' && results.artists.length > 4 && (
                    <Pressable
                      onPress={() => setActiveTab('artists')}
                      hitSlop={8}>
                      <Text
                        style={[
                          styles.seeAllLink,
                          { color: Colors.dark.accent },
                        ]}>
                        Ver todos ({results.artists.length})
                      </Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.artistsGrid}>
                  {(activeTab === 'all'
                    ? results.artists.slice(0, 4)
                    : results.artists
                  ).map((artist: SearchArtist) => (
                    <Pressable
                      key={artist.id}
                      onPress={() => {
                        if (!artist.id) return;
                        router.push({
                          pathname: '/(tabs)/home/artist/[id]' as any,
                          params: { id: artist.id, name: artist.name },
                        });
                      }}
                      style={({ pressed }) => [
                        styles.artistCard,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                        pressed && styles.cardPressed,
                      ]}>
                      <Image
                        source={{
                          uri: artist.avatarUrl || artist.avatar || DEFAULT_AVATAR,
                        }}
                        style={styles.artistAvatar}
                        contentFit="cover"
                      />
                      <Text
                        style={[styles.artistName, { color: theme.text }]}
                        numberOfLines={1}>
                        {artist.name}
                      </Text>
                      <Text
                        style={[
                          styles.artistSub,
                          { color: theme.textSecondary },
                        ]}
                        numberOfLines={1}>
                        {artist.trackCount ? `${artist.trackCount} hinos` : 'Cantor'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* 4. SEÇÃO DE PLAYLISTS */}
            {hasPlaylists &&
              (activeTab === 'all' || activeTab === 'playlists') && (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Playlists
                    </Text>
                    {activeTab === 'all' && results.playlists.length > 4 && (
                      <Pressable
                        onPress={() => setActiveTab('playlists')}
                        hitSlop={8}>
                        <Text
                          style={[
                            styles.seeAllLink,
                            { color: Colors.dark.accent },
                          ]}>
                          Ver todos ({results.playlists.length})
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.playlistsGrid}>
                    {(activeTab === 'all'
                      ? results.playlists.slice(0, 4)
                      : results.playlists
                    ).map((p: SearchPlaylist) => (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          if (!p.id) return;
                          router.push({
                            pathname: '/(tabs)/playlists/[id]',
                            params: { id: p.id, from: 'search' },
                          });
                        }}
                        style={[
                          styles.playlistCard,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          },
                        ]}>
                        <Image
                          source={{ uri: p.coverUrl || DEFAULT_COVER }}
                          style={styles.playlistCover}
                          contentFit="cover"
                        />
                        <Text
                          style={[
                            styles.playlistTitle,
                            { color: theme.text },
                          ]}
                          numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text
                          style={[
                            styles.playlistCreator,
                            { color: theme.textSecondary },
                          ]}
                          numberOfLines={1}>
                          {p.user?.username
                            ? `Por @${p.user.username.replace('@', '')}`
                            : `${p.trackCount || 0} hinos`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
          </View>
        )}
      </ScrollView>

      {/* Modal de Ações da Faixa */}
      <TrackActionsModal
        track={selectedTrackForActions}
        visible={selectedTrackForActions !== null}
        onClose={() => setSelectedTrackForActions(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  screenTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 14,
    padding: 0,
  },
  clearInputButton: {
    padding: 4,
  },
  tabsScroll: {
    gap: 8,
    paddingTop: 12,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tabPillText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centerMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  infoMessageText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  exploreSection: {
    gap: 24,
  },
  recentHistoryBlock: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  clearAllText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  recentChipText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    maxWidth: 200,
  },
  chipRemoveBtn: {
    padding: 2,
    marginLeft: 2,
  },
  exploreCategoriesBlock: {
    gap: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardName: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  resultsContainer: {
    gap: 24,
  },
  sectionBlock: {
    gap: 12,
  },
  seeAllLink: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  tracksVerticalList: {
    gap: 8,
  },
  albumsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  albumCard: {
    width: '48%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  albumCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#1E201C',
  },
  albumTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  albumArtist: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  artistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  artistCard: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    gap: 6,
  },
  artistAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1E201C',
    marginBottom: 4,
  },
  artistName: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    textAlign: 'center',
  },
  artistSub: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    textAlign: 'center',
  },
  playlistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  playlistCard: {
    width: '48%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  playlistCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#1E201C',
  },
  playlistTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  playlistCreator: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
});
