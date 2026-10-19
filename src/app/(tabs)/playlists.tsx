import { ListMusic } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';

export default function PlaylistsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 80 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Playlists</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <ListMusic size={36} color={Colors.dark.accent} />
        </View>
        <Text style={styles.placeholderTitle}>Minhas Playlists</Text>
        <Text style={styles.placeholderSubtitle}>
          Crie seleções personalizadas com seus hinos prediletos para momentos especiais.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D12',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
