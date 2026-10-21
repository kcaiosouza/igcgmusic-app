import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Heart,
  HeartHandshake,
  LogIn,
  Play,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
import { likesService } from '@/services/likes.service';
import { Track } from '@/types/player';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const { isAuthenticated, loading: authLoading, likedTracks, syncLikes } = useAuth();
  const { playList, activeTrack } = usePlayer();

  const [catalog, setCatalog] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDraggingItem, setIsDraggingItem] = useState(false);

  // Modal para opções da faixa (3 pontos: tocar agora, curtir/descurtir, fila)
  const [selectedTrackForActions, setSelectedTrackForActions] =
    useState<Track | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) {
      return;
    }

    likesService
      .getLikes()
      .then((tracks) => {
        if (isMounted) {
          setCatalog(tracks);
        }
      })
      .catch((err) => {
        console.warn('Failed to load liked tracks:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const onRefresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsRefreshing(true);
    try {
      await syncLikes();
      const tracks = await likesService.getLikes();
      setCatalog(tracks);
    } catch (err) {
      console.warn('Failed to refresh liked tracks:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, syncLikes]);

  // Filtra as faixas pelo Set de curtidas sincronizado e garante unicidade por ID
  const displayedTracks = React.useMemo(() => {
    const seen = new Set<string>();
    return catalog.filter((t) => {
      if (!t.id || !likedTracks.has(t.id) || seen.has(t.id)) {
        return false;
      }
      seen.add(t.id);
      return true;
    });
  }, [catalog, likedTracks]);

  const handlePlayAll = () => {
    if (displayedTracks.length > 0) {
      playList(displayedTracks, 0);
    }
  };

  const handlePlayTrack = (track: Track, index: number) => {
    playList(displayedTracks, index);
  };

  // Callback de reordenação acionado ao soltar o item arrastado
  const handleReorderTracks = async (newTracks: Track[]) => {
    const previousTracks = catalog;
    setCatalog(newTracks);

    try {
      await likesService.reorder(newTracks.map((t) => t.id));
    } catch (err) {
      console.warn('Erro ao sincronizar nova ordem no backend:', err);
      setCatalog(previousTracks);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Efeito Smooth na Cor Vermelha na Parte Superior */}
      <LinearGradient
        colors={
          isDark
            ? [
                'rgba(239, 68, 68, 0.44)',
                'rgba(220, 38, 38, 0.26)',
                'rgba(185, 28, 28, 0.12)',
                'rgba(127, 29, 29, 0.03)',
                'transparent',
              ]
            : [
                'rgba(255, 77, 77, 0.32)',
                'rgba(255, 110, 110, 0.18)',
                'rgba(255, 160, 160, 0.08)',
                'rgba(255, 200, 200, 0.02)',
                'transparent',
              ]
        }
        locations={[0, 0.24, 0.52, 0.78, 1]}
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
        {/* Cabeçalho de Favoritos (apenas o quadrado com gradiente e coração) */}
        <View style={styles.likedHeader}>
          <LinearGradient
            colors={['#FF4D4D', '#CC0000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCover}>
            <Heart size={56} color="#FFFFFF" fill="#FFFFFF" />
          </LinearGradient>

          <View style={styles.likedInfo}>
            <Text style={styles.likedTag}>SUA PLAYLIST</Text>
            <Text style={[styles.likedTitle, { color: colors.text }]}>
              Hinos Favoritos
            </Text>
            {isAuthenticated && !isLoading && (
              <Text style={[styles.likedMeta, { color: colors.textSecondary }]}>
                {displayedTracks.length}{' '}
                {displayedTracks.length === 1
                  ? 'música curtida'
                  : 'músicas curtidas'}
              </Text>
            )}
          </View>
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
            <Text
              style={[styles.authPromptText, { color: colors.textSecondary }]}>
              Entre em sua conta para ver e salvar seus hinos favoritos.
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
              Carregando favoritos...
            </Text>
          </View>
        )}

        {/* Estado Autenticado com Lista de Hinos */}
        {isAuthenticated && !isLoading && (
          <>
            {displayedTracks.length > 0 && (
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

            {displayedTracks.length === 0 ? (
              <View
                style={[
                  styles.emptyContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.borderSubtle,
                  },
                ]}>
                <HeartHandshake size={48} color={colors.textSecondary} />
                <Text
                  style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  Nenhum hino curtido ainda
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: colors.textSecondary },
                  ]}>
                  Clique no ícone de coração dos hinos no player ou no menu para
                  adicioná-los aos seus favoritos.
                </Text>
              </View>
            ) : (
              <DraggableTrackList
                tracks={displayedTracks}
                activeTrackId={activeTrack?.id}
                onPlayTrack={handlePlayTrack}
                onMorePress={setSelectedTrackForActions}
                onReorder={handleReorderTracks}
                onDragStateChange={setIsDraggingItem}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Modal de Ações da Faixa (Tocar agora, Curtir/Descurtir, Fila) */}
      <TrackActionsModal
        track={selectedTrackForActions}
        visible={!!selectedTrackForActions}
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
    height: 420,
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
  likedHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
    marginBottom: 26,
  },
  iconCover: {
    width: 140,
    height: 140,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  likedInfo: {
    alignItems: 'center',
    gap: 6,
  },
  likedTag: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: '#FF4D4D',
    letterSpacing: 1.2,
  },
  likedTitle: {
    fontSize: 28,
    fontFamily: Fonts.extraBold,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  likedMeta: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 2,
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
  emptyContainer: {
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
  authPromptCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    gap: 18,
    marginTop: 10,
  },
  authPromptText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
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
});
