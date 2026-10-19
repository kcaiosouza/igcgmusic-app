/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F2328',
    background: '#F7F8FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6E8EB',
    textSecondary: '#656D76',
    card: '#FFFFFF',
    cardSecondary: '#F0F2F5',
    border: '#E1E4E8',
    borderSubtle: '#D0D7DE',
    accent: '#04D361',
    accentHover: '#03BE56',
    accentInk: '#03200E',
    olive: '#404638',
    oliveLight: '#5D6652',
    oliveLogo: '#464B36',
  },
  dark: {
    text: '#F7F8FA',
    background: '#0D1117',
    backgroundElement: '#161B22',
    backgroundSelected: '#171B22',
    textSecondary: '#AFB2B1',
    card: '#161B22',
    cardSecondary: '#171B22',
    border: '#21262D',
    borderSubtle: '#30363D',
    accent: '#04D361',
    accentHover: '#03BE56',
    accentInk: '#03200E',
    olive: '#404638',
    oliveLight: '#5D6652',
    oliveLogo: '#464B36',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  sans: 'Inter_400Regular',
  mono: Platform.select({
    ios: 'ui-monospace',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

