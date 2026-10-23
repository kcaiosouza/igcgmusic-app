import { Image } from 'expo-image';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { usePlayer } from '@/contexts/player-context';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120';

export default function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const {
    activeTrack,
    hasActiveTrack,
    isPlaying,
    isBuffering,
    progressPercent,
    togglePlay,
    playNext,
    playPrevious,
    openExpanded,
  } = usePlayer();

  if (!hasActiveTrack || !activeTrack) {
    return null;
  }

  // Altura da tab adaptada por plataforma para fixar perfeitamente em cima
  const bottomOffset = Platform.select({
    ios: 49 + insets.bottom + 10,
    android: (insets.bottom > 0 ? insets.bottom : 8) + 86,
    default: 64 + insets.bottom + 10,
  });

  const subtitle = activeTrack.albumName
    ? `${activeTrack.albumName} • ${activeTrack.members || 'Artista Desconhecido'}`
    : activeTrack.members || 'Artista Desconhecido';

  return (
    <Pressable
      onPress={openExpanded}
      style={({ pressed }) => [
        styles.container,
        { bottom: bottomOffset },
        pressed && styles.pressed,
      ]}>
      {/* Barra fina de progresso na borda inferior do miniplayer */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.min(100, Math.max(0, progressPercent))}%` },
          ]}
        />
      </View>

      <View style={styles.contentRow}>
        {/* Capa do Álbum / Hino */}
        <Image
          source={{ uri: activeTrack.thumbnail || DEFAULT_COVER }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />

        {/* Informações da Faixa */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {activeTrack.title}
            </Text>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* Controles de Reprodução */}
        <View style={styles.controlsGroup}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              playPrevious();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.controlBtn,
              pressed && styles.controlBtnPressed,
            ]}>
            <SkipBack size={18} color="rgba(255, 255, 255, 0.85)" fill="rgba(255, 255, 255, 0.85)" />
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.playBtn,
              pressed && styles.playBtnPressed,
            ]}>
            {isBuffering ? (
              <ActivityIndicator size="small" color="#2E2E20" />
            ) : isPlaying ? (
              <Pause size={16} color="#2E2E20" fill="#2E2E20" />
            ) : (
              <Play size={16} color="#2E2E20" fill="#2E2E20" style={{ marginLeft: 2 }} />
            )}
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              playNext();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.controlBtn,
              pressed && styles.controlBtnPressed,
            ]}>
            <SkipForward size={18} color="rgba(255, 255, 255, 0.85)" fill="rgba(255, 255, 255, 0.85)" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 64,
    backgroundColor: '#2E2E20',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  progressBarTrack: {
    height: 2.5,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1E201C',
  },
  infoSection: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlBtn: {
    padding: 6,
  },
  controlBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  playBtnPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
});
