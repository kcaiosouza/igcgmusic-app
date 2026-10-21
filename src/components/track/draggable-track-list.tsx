/* eslint-disable react-hooks/immutability */
import { Image } from 'expo-image';
import { Clock, MoreVertical } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Track } from '@/types/player';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300';

export const ITEM_HEIGHT = 64;
export const ITEM_GAP = 8;
export const SLOT_HEIGHT = ITEM_HEIGHT + ITEM_GAP; // 72px

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface DraggableItemProps {
  track: Track;
  index: number;
  totalCount: number;
  isCurrentActive: boolean;
  activeDragIndex: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  isDraggingAny: SharedValue<boolean>;
  onPlay: (track: Track, index: number) => void;
  onMorePress: (track: Track) => void;
  onCommitReorder: (fromIndex: number, toIndex: number) => void;
  onDragStateChange?: (dragging: boolean) => void;
}

function DraggableTrackItem({
  track,
  index,
  totalCount,
  isCurrentActive,
  activeDragIndex,
  hoverIndex,
  dragY,
  isDraggingAny,
  onPlay,
  onMorePress,
  onCommitReorder,
  onDragStateChange,
}: DraggableItemProps) {
  const colors = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const isThisActive = activeDragIndex.value === index;
    const isAnyActive = activeDragIndex.value !== -1;

    // Se este item está sendo arrastado: segue o dedo com elevação e escala
    if (isThisActive) {
      return {
        transform: [{ translateY: dragY.value }, { scale: 1.03 }],
        zIndex: 999,
        elevation: 12,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        borderColor: colors.accent,
      };
    }

    // Se outro item está sendo arrastado: calcula o deslocamento para abrir espaçamento
    if (isAnyActive) {
      const activeIdx = activeDragIndex.value;
      const targetHover = hoverIndex.value;
      let targetY = 0;

      if (activeIdx < targetHover) {
        // O item ativo está descendo
        if (index > activeIdx && index <= targetHover) {
          targetY = -SLOT_HEIGHT;
        }
      } else if (activeIdx > targetHover) {
        // O item ativo está subindo
        if (index >= targetHover && index < activeIdx) {
          targetY = SLOT_HEIGHT;
        }
      }

      return {
        transform: [
          {
            translateY: withSpring(targetY, {
              damping: 18,
              stiffness: 190,
              mass: 0.8,
            }),
          },
          { scale: 1 },
        ],
        zIndex: 1,
        elevation: 1,
        shadowOpacity: 0,
        borderColor: isCurrentActive ? colors.accent : colors.borderSubtle,
      };
    }

    // Estado padrão de repouso
    return {
      transform: [{ translateY: withTiming(0, { duration: 160 }) }, { scale: 1 }],
      zIndex: 1,
      elevation: 1,
      shadowOpacity: 0,
      borderColor: isCurrentActive ? colors.accent : colors.borderSubtle,
    };
  }, [index, isCurrentActive, colors.accent, colors.borderSubtle]);

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart(() => {
      'worklet';
      isDraggingAny.value = true;
      activeDragIndex.value = index;
      hoverIndex.value = index;
      dragY.value = 0;
      if (onDragStateChange) {
        runOnJS(onDragStateChange)(true);
      }
    })
    .onUpdate((event) => {
      'worklet';
      dragY.value = event.translationY;
      const floatingPos = activeDragIndex.value + event.translationY / SLOT_HEIGHT;
      const clamped = Math.max(0, Math.min(totalCount - 1, Math.round(floatingPos)));
      if (clamped !== hoverIndex.value) {
        hoverIndex.value = clamped;
      }
    })
    .onEnd(() => {
      'worklet';
      const fromIdx = activeDragIndex.value;
      const toIdx = hoverIndex.value;
      const finalOffset = (toIdx - fromIdx) * SLOT_HEIGHT;

      // Anima o item até a posição exata da vaga aberta
      dragY.value = withSpring(
        finalOffset,
        { damping: 18, stiffness: 200, mass: 0.8 },
        (finished) => {
          if (finished) {
            isDraggingAny.value = false;
            activeDragIndex.value = -1;
            hoverIndex.value = -1;
            dragY.value = 0;
            if (onDragStateChange) {
              runOnJS(onDragStateChange)(false);
            }
            if (fromIdx !== toIdx) {
              runOnJS(onCommitReorder)(fromIdx, toIdx);
            }
          }
        }
      );
    })
    .onFinalize((event, success) => {
      'worklet';
      if (!success && isDraggingAny.value && activeDragIndex.value === index) {
        isDraggingAny.value = false;
        activeDragIndex.value = -1;
        hoverIndex.value = -1;
        dragY.value = 0;
        if (onDragStateChange) {
          runOnJS(onDragStateChange)(false);
        }
      }
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(280)
    .onEnd(() => {
      'worklet';
      runOnJS(onPlay)(track, index);
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  return (
    <Animated.View
      style={[
        styles.itemRow,
        {
          backgroundColor: colors.card,
          borderWidth: isCurrentActive ? 1 : 0,
          borderColor: isCurrentActive ? colors.accent : colors.borderSubtle,
        },
        animatedStyle,
      ]}>
      {/* Área tocável e arrastável: Capa, Título, Artista, Duração */}
      <GestureDetector gesture={composedGesture}>
        <View style={styles.playableArea}>
          <View style={styles.trackLeft}>
            <Text
              style={[
                styles.trackIndex,
                {
                  color: isCurrentActive ? colors.accent : colors.textSecondary,
                },
              ]}>
              {(index + 1).toString().padStart(2, '0')}
            </Text>

            <Image
              source={{ uri: track.thumbnail || DEFAULT_COVER }}
              style={styles.trackCover}
              contentFit="cover"
            />

            <View style={styles.trackMetaGroup}>
              <Text
                style={[
                  styles.trackTitle,
                  {
                    color: isCurrentActive ? colors.accent : colors.text,
                  },
                ]}
                numberOfLines={1}>
                {track.title}
              </Text>
              <Text
                style={[styles.trackArtist, { color: colors.textSecondary }]}
                numberOfLines={1}>
                {track.albumName
                  ? `${track.albumName} • ${track.members || 'Artista Desconhecido'}`
                  : track.members || 'Artista Desconhecido'}
              </Text>
            </View>
          </View>

          <View style={styles.durationGroup}>
            <Clock size={12} color={colors.textSecondary} />
            <Text
              style={[
                styles.durationText,
                { color: colors.textSecondary },
              ]}>
              {formatDuration(track.duration)}
            </Text>
          </View>
        </View>
      </GestureDetector>

      {/* Botão de Ações Isolado (3 Pontos) */}
      <Pressable
        hitSlop={12}
        onPress={() => onMorePress(track)}
        style={({ pressed }) => [
          styles.moreButton,
          pressed && { opacity: 0.6 },
        ]}>
        <MoreVertical size={16} color={colors.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

export interface DraggableTrackListProps {
  tracks: Track[];
  activeTrackId?: string;
  onPlayTrack: (track: Track, index: number) => void;
  onMorePress: (track: Track) => void;
  onReorder: (newTracks: Track[]) => void;
  onDragStateChange?: (dragging: boolean) => void;
}

export default function DraggableTrackList({
  tracks,
  activeTrackId,
  onPlayTrack,
  onMorePress,
  onReorder,
  onDragStateChange,
}: DraggableTrackListProps) {
  const colors = useTheme();

  // Estados compartilhados de animação na UI thread
  const activeDragIndex = useSharedValue<number>(-1);
  const hoverIndex = useSharedValue<number>(-1);
  const dragY = useSharedValue<number>(0);
  const isDraggingAny = useSharedValue<boolean>(false);

  const handleCommitReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= tracks.length || toIndex >= tracks.length) return;

      const newTracks = [...tracks];
      const [moved] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, moved);

      onReorder(newTracks);
    },
    [tracks, onReorder]
  );

  return (
    <View
      style={[
        styles.listContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.borderSubtle,
        },
      ]}>
      {tracks.map((track, index) => {
        const isCurrentActive = activeTrackId === track.id;

        return (
          <DraggableTrackItem
            key={track.id || String(index)}
            track={track}
            index={index}
            totalCount={tracks.length}
            isCurrentActive={isCurrentActive}
            activeDragIndex={activeDragIndex}
            hoverIndex={hoverIndex}
            dragY={dragY}
            isDraggingAny={isDraggingAny}
            onPlay={onPlayTrack}
            onMorePress={onMorePress}
            onCommitReorder={handleCommitReorder}
            onDragStateChange={onDragStateChange}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    gap: ITEM_GAP,
  },
  itemRow: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  playableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    minWidth: 0,
    marginRight: 10,
  },
  trackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  trackIndex: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
  trackCover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
  },
  trackMetaGroup: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  trackArtist: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  durationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 10,
    flexShrink: 0,
  },
  durationText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  moreButton: {
    padding: 6,
    borderRadius: 12,
    flexShrink: 0,
  },
});
