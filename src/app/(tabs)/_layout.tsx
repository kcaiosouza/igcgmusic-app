import React from 'react';
import { StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';
import ExpandedPlayer from '@/components/player/expanded-player';
import MiniPlayer from '@/components/player/mini-player';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <AppTabs />
      <MiniPlayer />
      <ExpandedPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
