import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ChevronDown,
  Heart,
  ListMusic,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Repeat,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import QueueModal from '@/components/player/queue-modal';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePlayer } from '@/contexts/player-context';
import { parseFullChords } from '@/utils/chords';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DISC_SIZE = Math.min(260, SCREEN_WIDTH * 0.68);
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400';

function formatSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function ExpandedPlayer() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.select({
    ios: insets.top,
    android: Math.max(insets.top, RNStatusBar.currentHeight || 28),
    default: insets.top,
  });

  const {
    activeTrack,
    upcomingQueue,
    isExpanded,
    closeExpanded,
    isPlaying,
    isBuffering,
    isLooping,
    isShuffling,
    currentTime,
    duration,
    progressPercent,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    toggleLoop,
    toggleShuffle,
  } = usePlayer();

  const { likedTracks, toggleLike } = useAuth();
  const [activeTab, setActiveTab] = useState<'lyrics' | 'chords'>('lyrics');
  const isLiked = activeTrack?.id ? likedTracks.has(activeTrack.id) : false;
  const [isLyricsExpanded, setIsLyricsExpanded] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Scrubber fluido em tempo real
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubPercent, setScrubPercent] = useState<number>(0);
  const scrubberRef = useRef<View | null>(null);
  const scrubberLayout = useRef<{ x: number; width: number }>({
    x: 24,
    width: SCREEN_WIDTH - 48,
  });

  const handleScrubberTouch = (pageX: number) => {
    if (!duration || duration <= 0) return 0;
    const { x, width } = scrubberLayout.current;
    const safeWidth = width > 0 ? width : SCREEN_WIDTH - 48;
    const relativeX = pageX - x;
    const ratio = Math.max(0, Math.min(1, relativeX / safeWidth));
    setScrubPercent(ratio * 100);
    return ratio * duration;
  };

  const handleScrubberRelease = (pageX: number) => {
    const targetSeconds = handleScrubberTouch(pageX);
    seekTo(targetSeconds);
    setIsScrubbing(false);
  };

  const displayPercent = isScrubbing ? scrubPercent : progressPercent;
  const displayCurrentTime = isScrubbing
    ? (scrubPercent / 100) * (duration || 0)
    : currentTime;

  // Rotação contínua do disco de vinil / CD
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, {
          duration: 22000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
    }
  }, [isPlaying, rotation]);

  const animatedDiscStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value % 360}deg` }],
  }));

  const handleShare = async () => {
    if (!activeTrack) return;
    try {
      await Share.share({
        message: `Ouça "${activeTrack.title}" no IGCG Music!\n${activeTrack.url}`,
        title: activeTrack.title,
      });
    } catch {
      // Ignora cancelamento
    }
  };

  const chords = activeTrack?.chords;
  const parsedChords = useMemo(() => {
    if (!chords) return [];
    return parseFullChords(chords);
  }, [chords]);

  const hasChords = parsedChords.length > 0;
  const hasLyrics = Boolean(activeTrack?.lyrics);

  if (!activeTrack) {
    return null;
  }

  const albumName = activeTrack.albumName || 'IGCG Music';
  const subtitle = activeTrack.albumName
    ? `${activeTrack.albumName} • ${activeTrack.members || 'Artista Desconhecido'}`
    : activeTrack.members || 'Artista Desconhecido';

  return (
    <Modal
      visible={isExpanded}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={closeExpanded}>
      <View style={styles.root}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#252820', '#131510', '#0D1117']}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.safeArea,
            { paddingTop: topInset, paddingBottom: insets.bottom },
          ]}>
          {/* Header Superior */}
          <View style={styles.header}>
            <View style={styles.dragPill} />
            <View style={styles.headerRow}>
              <Pressable
                onPress={closeExpanded}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  pressed && styles.iconButtonPressed,
                ]}>
                <ChevronDown size={24} color="#FFFFFF" />
              </Pressable>

              <View style={styles.headerTextGroup}>
                <Text style={styles.headerSub}>TOCANDO AGORA</Text>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {albumName}
                </Text>
              </View>

              <Pressable
                onPress={handleShare}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  pressed && styles.iconButtonPressed,
                ]}>
                <Share2 size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}>
            {/* Seção do CD Vinil Giratório */}
            <View style={styles.cdSection}>
              <Animated.View style={[styles.cdDisc, animatedDiscStyle]}>
                {/* Imagem de Capa do Álbum no CD */}
                <Image
                  source={{ uri: activeTrack.thumbnail || DEFAULT_COVER }}
                  style={styles.cdImage}
                  contentFit="cover"
                />

                {/* Ranhuras e Brilho do Vinil */}
                <View style={styles.cdGrooves} pointerEvents="none" />
                <View style={styles.cdShine} pointerEvents="none" />

                {/* Miolo metálico central com furo */}
                <View style={styles.cdHub}>
                  <View style={styles.cdHubInner}>
                    <View style={styles.cdHubHole} />
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Metadados do Hino (Título, Artista, Curtir) */}
            <View style={styles.metadataSection}>
              <View style={styles.trackInfo}>
                <Text style={styles.mainTitle} numberOfLines={2}>
                  {activeTrack.title}
                </Text>
                <Pressable
                  onPress={() => {
                    const artistKey =
                      activeTrack.authorId || activeTrack.members;
                    if (artistKey) {
                      closeExpanded();
                      router.push({
                        pathname: '/(tabs)/home/artist/[id]' as any,
                        params: { id: artistKey, name: activeTrack.members },
                      });
                    }
                  }}
                  hitSlop={8}>
                  <Text style={styles.subtitleText} numberOfLines={1}>
                    {subtitle}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  if (activeTrack?.id) {
                    toggleLike(activeTrack.id);
                  }
                }}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.heartButton,
                  pressed && styles.iconButtonPressed,
                ]}>
                <Heart
                  size={24}
                  color={isLiked ? '#FF4D4D' : 'rgba(255, 255, 255, 0.7)'}
                  fill={isLiked ? '#FF4D4D' : 'transparent'}
                />
              </Pressable>
            </View>

            {/* Scrubber / Slider de Progresso com arrasto fluido em tempo real */}
            <View
              ref={scrubberRef}
              onLayout={() => {
                scrubberRef.current?.measure((_x, _y, width, _height, pageX) => {
                  if (width > 0) {
                    scrubberLayout.current = { x: pageX, width };
                  }
                });
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(evt) => {
                setIsScrubbing(true);
                handleScrubberTouch(evt.nativeEvent.pageX);
              }}
              onResponderMove={(evt) => {
                handleScrubberTouch(evt.nativeEvent.pageX);
              }}
              onResponderRelease={(evt) => {
                handleScrubberRelease(evt.nativeEvent.pageX);
              }}
              onResponderTerminate={() => {
                setIsScrubbing(false);
              }}
              style={styles.scrubberContainer}>
              <View style={styles.scrubberTrack}>
                <View style={styles.scrubberBackground} />
                <View
                  style={[
                    styles.scrubberFill,
                    { width: `${displayPercent}%` },
                  ]}
                />
                <View
                  style={[
                    styles.scrubberThumb,
                    isScrubbing && styles.scrubberThumbActive,
                    { left: `${Math.max(0, Math.min(100, displayPercent))}%` },
                  ]}
                />
              </View>
              <View style={styles.timeRow}>
                <Text
                  style={[
                    styles.timeLabel,
                    isScrubbing && styles.timeLabelActive,
                  ]}>
                  {formatSeconds(displayCurrentTime)}
                </Text>
                <Text style={styles.timeLabel}>{formatSeconds(duration)}</Text>
              </View>
            </View>

            {/* Linha de Controles de Reprodução */}
            <View style={styles.controlsRow}>
              {/* Shuffle */}
              <Pressable
                onPress={toggleShuffle}
                hitSlop={10}
                style={styles.secondaryButton}>
                <Shuffle
                  size={20}
                  color={isShuffling ? Colors.dark.accent : 'rgba(255, 255, 255, 0.55)'}
                />
                {isShuffling ? <View style={styles.activeDot} /> : null}
              </Pressable>

              {/* Anterior */}
              <Pressable
                onPress={playPrevious}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.controlIconButton,
                  pressed && styles.iconButtonPressed,
                ]}>
                <SkipBack size={26} color="#FFFFFF" fill="#FFFFFF" />
              </Pressable>

              {/* Play / Pause Principal */}
              <Pressable
                onPress={togglePlay}
                style={({ pressed }) => [
                  styles.mainPlayButton,
                  pressed && styles.mainPlayButtonPressed,
                ]}>
                {isBuffering ? (
                  <ActivityIndicator size="small" color="#12140F" />
                ) : isPlaying ? (
                  <Pause size={28} color="#12140F" fill="#12140F" />
                ) : (
                  <Play size={28} color="#12140F" fill="#12140F" style={{ marginLeft: 3 }} />
                )}
              </Pressable>

              {/* Próxima */}
              <Pressable
                onPress={playNext}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.controlIconButton,
                  pressed && styles.iconButtonPressed,
                ]}>
                <SkipForward size={26} color="#FFFFFF" fill="#FFFFFF" />
              </Pressable>

              {/* Repeat */}
              <Pressable
                onPress={toggleLoop}
                hitSlop={10}
                style={styles.secondaryButton}>
                <Repeat
                  size={20}
                  color={isLooping ? Colors.dark.accent : 'rgba(255, 255, 255, 0.55)'}
                />
                {isLooping ? <View style={styles.activeDot} /> : null}
              </Pressable>
            </View>

            {/* Botão de Fila de Reprodução */}
            <Pressable
              onPress={() => setIsQueueOpen(true)}
              style={({ pressed }) => [
                styles.queuePillButton,
                pressed && styles.queuePillButtonPressed,
              ]}>
              <ListMusic size={16} color="#FFFFFF" />
              <Text style={styles.queuePillText}>Fila de Reprodução</Text>
              {upcomingQueue.length > 0 && (
                <View style={styles.queuePillBadge}>
                  <Text style={styles.queuePillBadgeText}>
                    {upcomingQueue.length}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Card de Letra e Cifras com Abas */}
            <View style={styles.lyricsCard}>
              <View style={styles.tabHeaderRow}>
                <View style={styles.tabButtonsGroup}>
                  <Pressable
                    onPress={() => setActiveTab('lyrics')}
                    style={[
                      styles.tabButton,
                      activeTab === 'lyrics' && styles.tabButtonActive,
                    ]}>
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'lyrics' && styles.tabButtonTextActive,
                      ]}>
                      Letra
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => hasChords && setActiveTab('chords')}
                    disabled={!hasChords}
                    style={[
                      styles.tabButton,
                      activeTab === 'chords' && styles.tabButtonActive,
                      !hasChords && styles.tabButtonDisabled,
                    ]}>
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'chords' && styles.tabButtonTextActive,
                        !hasChords && styles.tabButtonTextDisabled,
                      ]}>
                      Cifras
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => setIsLyricsExpanded(!isLyricsExpanded)}
                  hitSlop={8}
                  style={styles.expandButton}>
                  {isLyricsExpanded ? (
                    <Minimize2 size={16} color="rgba(255, 255, 255, 0.6)" />
                  ) : (
                    <Maximize2 size={16} color="rgba(255, 255, 255, 0.6)" />
                  )}
                </Pressable>
              </View>

              {/* Conteúdo da Aba */}
              {activeTab === 'lyrics' ? (
                hasLyrics ? (
                  <View
                    style={[
                      styles.textContainer,
                      !isLyricsExpanded && styles.textContainerCollapsed,
                    ]}>
                    <Text style={styles.lyricsText}>{activeTrack.lyrics}</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>
                    Letra não disponível para este hino.
                  </Text>
                )
              ) : (
                hasChords ? (
                  <View
                    style={[
                      styles.textContainer,
                      !isLyricsExpanded && styles.textContainerCollapsed,
                    ]}>
                    {activeTrack.tone ? (
                      <Text style={styles.toneText}>
                        Tom: <Text style={{ color: Colors.dark.accent }}>{activeTrack.tone}</Text>
                        {activeTrack.intro ? ` • Intro: ${activeTrack.intro}` : ''}
                      </Text>
                    ) : null}

                    {parsedChords.map((line, idx) => (
                      <View key={idx} style={styles.chordLine}>
                        {line.hasChords ? (
                          <View style={styles.chordSegmentRow}>
                            {line.segments.map((seg, sIdx) => (
                              <View key={sIdx} style={styles.chordSegment}>
                                {seg.chord ? (
                                  <Text style={styles.chordTag}>{seg.chord}</Text>
                                ) : (
                                  <Text style={styles.chordTagEmpty}> </Text>
                                )}
                                <Text style={styles.chordLyric}>
                                  {seg.text || ' '}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.plainChordLine}>
                            {line.plainText}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>
                    Cifra não disponível para este hino.
                  </Text>
                )
              )}
            </View>
          </ScrollView>
        </View>

        {/* Modal da Fila de Reprodução */}
        <QueueModal
          visible={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 10,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  headerIconButton: {
    padding: 8,
  },
  iconButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  headerTextGroup: {
    alignItems: 'center',
    maxWidth: '65%',
  },
  headerSub: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  cdSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    height: DISC_SIZE + 20,
  },
  cdDisc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    backgroundColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  cdImage: {
    width: DISC_SIZE * 0.92,
    height: DISC_SIZE * 0.92,
    borderRadius: (DISC_SIZE * 0.92) / 2,
  },
  cdGrooves: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: DISC_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cdShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: DISC_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cdHub: {
    position: 'absolute',
    width: DISC_SIZE * 0.32,
    height: DISC_SIZE * 0.32,
    borderRadius: (DISC_SIZE * 0.32) / 2,
    backgroundColor: '#A0A0A0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  cdHubInner: {
    width: '70%',
    height: '70%',
    borderRadius: 999,
    backgroundColor: '#DCDCDC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cdHubHole: {
    width: '35%',
    height: '35%',
    borderRadius: 999,
    backgroundColor: '#12140F',
  },
  metadataSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trackInfo: {
    flex: 1,
    marginRight: 16,
  },
  mainTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  heartButton: {
    padding: 8,
  },
  scrubberContainer: {
    width: '100%',
    marginBottom: 20,
    paddingVertical: 6,
  },
  scrubberTrack: {
    width: '100%',
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  scrubberBackground: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'absolute',
  },
  scrubberFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.accent,
    position: 'absolute',
  },
  scrubberThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    marginLeft: -7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  scrubberThumbActive: {
    transform: [{ scale: 1.35 }],
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.dark.accent,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  timeLabelActive: {
    color: Colors.dark.accent,
    fontFamily: Fonts.bold,
  },
  controlsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  secondaryButton: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.accent,
    position: 'absolute',
    bottom: 2,
  },
  controlIconButton: {
    padding: 8,
  },
  mainPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  mainPlayButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  lyricsCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  tabHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tabButtonsGroup: {
    flexDirection: 'row',
    backgroundColor: '#161814',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#272A22',
  },
  tabButtonDisabled: {
    opacity: 0.4,
  },
  tabButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: '#8A8E89',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabButtonTextDisabled: {
    color: '#555852',
  },
  expandButton: {
    padding: 6,
  },
  textContainer: {
    width: '100%',
  },
  textContainerCollapsed: {
    maxHeight: 180,
    overflow: 'hidden',
  },
  lyricsText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: '#E0E0E0',
    lineHeight: 26,
  },
  toneText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#A0A0A0',
    marginBottom: 10,
  },
  chordLine: {
    marginVertical: 4,
  },
  chordSegmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chordSegment: {
    marginRight: 4,
  },
  chordTag: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.dark.accent,
  },
  chordTagEmpty: {
    fontSize: 13,
  },
  chordLyric: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#FFFFFF',
  },
  plainChordLine: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingVertical: 12,
  },
  queuePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 4,
    alignSelf: 'center',
  },
  queuePillButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  queuePillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Fonts.medium,
  },
  queuePillBadge: {
    backgroundColor: 'rgba(4, 211, 97, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(4, 211, 97, 0.4)',
  },
  queuePillBadgeText: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
});
