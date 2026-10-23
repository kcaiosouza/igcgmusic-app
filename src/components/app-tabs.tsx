import React from 'react';
import { Platform } from 'react-native';

import AppTabsAndroid from './app-tabs.android';
import AppTabsIOS from './app-tabs.ios';

export default function AppTabs() {
  if (Platform.OS === 'ios') {
    return <AppTabsIOS />;
  }

  return <AppTabsAndroid />;
}
