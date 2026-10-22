import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { PlayerProvider } from '@/contexts/player-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const isAppReady = fontsReady && !authLoading;

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  useEffect(() => {
    if (!isAppReady) return;

    const firstSegment = (segments as string[])[0];
    const isPublicScreen = firstSegment === '+not-found' || firstSegment === '404';
    if (isPublicScreen) return;

    const inAuthGroup =
      firstSegment === '(auth)' ||
      firstSegment === 'login' ||
      firstSegment === 'signup' ||
      !firstSegment;

    if (isAuthenticated && inAuthGroup) {
      router.replace('/home');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, isAppReady, segments, router]);

  if (!isAppReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="index" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      <Stack.Screen name="404" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const fontsReady = Boolean(fontsLoaded || fontError);
  const isDark = colorScheme === 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PlayerProvider>
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <RootNavigator fontsReady={fontsReady} />
          </ThemeProvider>
        </PlayerProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
