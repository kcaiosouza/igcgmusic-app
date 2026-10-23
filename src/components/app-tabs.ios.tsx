import { NativeTabs } from 'expo-router/native-tabs';
import React from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabsIOS() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.accent}
      indicatorColor={
        scheme === 'dark'
          ? 'rgba(4, 211, 97, 0.22)'
          : 'rgba(4, 211, 97, 0.16)'
      }
      rippleColor="rgba(4, 211, 97, 0.15)"
      iconColor={{
        default: colors.textSecondary,
        selected: colors.accent,
      }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.accent },
      }}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home' }}
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Pesquisa</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }}
          md={{ default: 'search', selected: 'search' }}
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favorites">
        <NativeTabs.Trigger.Label>Favoritos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          md={{ default: 'favorite', selected: 'favorite' }}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="playlists">
        <NativeTabs.Trigger.Label>Playlists</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'music.note.list', selected: 'music.note.list' }}
          md={{ default: 'queue_music', selected: 'queue_music' }}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md={{ default: 'person', selected: 'person' }}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
