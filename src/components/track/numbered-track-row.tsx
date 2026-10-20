import { Image } from 'expo-image';
import { Clock, MoreVertical, Users } from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Track } from '@/types/player';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300';

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

export interface NumberedTrackRowProps {
  track: Track;
  index: number;
  isCurrent?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onMorePress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const NumberedTrackRow = React.memo(function NumberedTrackRow({
  track,
  index,
  isCurrent = false,
  onPress,
  onLongPress,
  onMorePress,
  style,
}: NumberedTrackRowProps) {
  const colors = useTheme();
  const handleMorePress = onMorePress || onLongPress;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.numberedTrackRow,
        {
          backgroundColor: colors.card,
          borderColor: isCurrent ? colors.accent : colors.borderSubtle,
        },
        pressed && styles.itemPressed,
        style,
      ]}>
      <Text
        style={[
          styles.trackIndexNumber,
          { color: isCurrent ? colors.accent : colors.textSecondary },
        ]}>
        {(index + 1).toString().padStart(2, '0')}
      </Text>
      <Image
        source={{ uri: track.thumbnail || DEFAULT_COVER }}
        style={styles.trackThumbnail}
        contentFit="cover"
      />
      <View style={styles.trackDetailsCol}>
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
          style={[styles.trackArtist, { color: colors.textSecondary }]}
          numberOfLines={1}>
          {track.members}
        </Text>
      </View>
      <View style={styles.trackStatsGroup}>
        {track.playCount ? (
          <View style={styles.statChip}>
            <Users size={12} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {formatNumber(track.playCount)}
            </Text>
          </View>
        ) : null}
        <View style={styles.statChip}>
          <Clock size={12} color={colors.textSecondary} />
          <Text style={[styles.statText, { color: colors.textSecondary }]}>
            {formatDuration(track.duration)}
          </Text>
        </View>
      </View>
      {handleMorePress && (
        <Pressable
          onPress={handleMorePress}
          hitSlop={10}
          style={styles.moreActionButton}>
          <MoreVertical size={16} color={colors.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  );
});

export default NumberedTrackRow;

const styles = StyleSheet.create({
  numberedTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  itemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  trackIndexNumber: {
    fontFamily: Fonts.extraBold,
    fontSize: 14,
    width: 22,
    textAlign: 'center',
  },
  trackThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1E201C',
  },
  trackDetailsCol: {
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
  trackStatsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
  },
  moreActionButton: {
    padding: 6,
    marginLeft: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
