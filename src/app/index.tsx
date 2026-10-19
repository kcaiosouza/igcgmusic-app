import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';

import { Colors, Fonts } from '@/constants/theme';

interface SongItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  duration: string;
  gradient: [string, string];
}

const PREVIEW_SONGS: SongItem[] = [
  {
    id: '1',
    number: '01',
    title: 'Até que Todos Cheguemos',
    subtitle: 'CD Desperta Geração • EAV',
    duration: '04:20',
    gradient: ['#D98E2B', '#7A3B1D'],
  },
  {
    id: '2',
    number: '02',
    title: 'Não Temerei',
    subtitle: 'CD Caminho Seguro • EAV',
    duration: '02:59',
    gradient: ['#E08A4C', '#2B4A66'],
  },
  {
    id: '3',
    number: '03',
    title: 'Oh Cristo en Tu muerte',
    subtitle: 'CD Nombre Sobre Todo Nombre • LSM',
    duration: '02:36',
    gradient: ['#5B7A96', '#1D2A3A'],
  },
  {
    id: '4',
    number: '04',
    title: 'O Amor é Meu Lugar',
    subtitle: 'Contraste • 288',
    duration: '03:29',
    gradient: ['#1D4F9C', '#0A1630'],
  },
  {
    id: '5',
    number: '05',
    title: 'Ce Qui Metait un Gain',
    subtitle: 'CD Christ Habite en Moi • LSM',
    duration: '02:29',
    gradient: ['#9FB4C8', '#4D6278'],
  },
  {
    id: '6',
    number: '06',
    title: 'Bem Aventurados',
    subtitle: 'CD Laços de Amor • EAV',
    duration: '03:32',
    gradient: ['#F5C542', '#8C5B23'],
  },
  {
    id: '7',
    number: '07',
    title: 'Não Depende de Quem Quer',
    subtitle: 'O Fluir do Espírito • EAV',
    duration: '03:23',
    gradient: ['#4FA8D1', '#1B4D68'],
  },
  {
    id: '8',
    number: '08',
    title: 'Es la Iglesia tan Gloriosa',
    subtitle: 'CD Se Acerca El Día • LSM',
    duration: '03:31',
    gradient: ['#F7D046', '#D49B1E'],
  },
  {
    id: '9',
    number: '09',
    title: 'Minha Oração',
    subtitle: 'CD Laços de Amor • EAV',
    duration: '03:32',
    gradient: ['#E0A96D', '#7C4328'],
  },
  {
    id: '10',
    number: '10',
    title: 'O Semeador',
    subtitle: 'O Semeador • Grupo Vocal Primícias',
    duration: '04:32',
    gradient: ['#E88D38', '#633014'],
  },
];

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [batchHeight, setBatchHeight] = useState(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (batchHeight > 0) {
      translateY.value = 0;
      // Smooth linear scroll at ~16px/s
      const duration = Math.round((batchHeight / 16) * 1000);
      translateY.value = withRepeat(
        withTiming(-batchHeight, {
          duration,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }
  }, [batchHeight, translateY]);

  const animatedTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const router = useRouter();

  const handleCreateAccount = () => {
    router.push('/signup');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.container}>
          {/* 1. Header / Marca Oficial */}
          <View style={styles.brandRow}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              contentFit="cover"
              accessibilityLabel="IGCGMusic Logo"
            />
            <Text style={[styles.brandName, { color: colors.text }]}>IGCGMusic</Text>
          </View>

          {/* 2. Prévia de hinos com rolagem contínua */}
          <View style={styles.previewContainer}>
            <Animated.View style={[styles.track, animatedTrackStyle]}>
              <View
                style={styles.batch}
                onLayout={(e) => {
                  const h = e.nativeEvent.layout.height;
                  if (h > 0 && h !== batchHeight) {
                    setBatchHeight(h);
                  }
                }}>
                {PREVIEW_SONGS.map((song) => (
                  <View
                    key={`b1-${song.id}`}
                    style={[
                      styles.songCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <Text style={[styles.songNumber, { color: colors.textSecondary }]}>
                      {song.number}
                    </Text>
                    <LinearGradient
                      colors={song.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.songCover}
                    />
                    <View style={styles.songDetails}>
                      <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text
                        style={[styles.songSubtitle, { color: colors.textSecondary }]}
                        numberOfLines={1}>
                        {song.subtitle}
                      </Text>
                    </View>
                    <Text style={[styles.songDuration, { color: colors.textSecondary }]}>
                      {song.duration}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Second batch for infinite seamless loop */}
              <View style={styles.batch}>
                {PREVIEW_SONGS.map((song) => (
                  <View
                    key={`b2-${song.id}`}
                    style={[
                      styles.songCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <Text style={[styles.songNumber, { color: colors.textSecondary }]}>
                      {song.number}
                    </Text>
                    <LinearGradient
                      colors={song.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.songCover}
                    />
                    <View style={styles.songDetails}>
                      <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text
                        style={[styles.songSubtitle, { color: colors.textSecondary }]}
                        numberOfLines={1}>
                        {song.subtitle}
                      </Text>
                    </View>
                    <Text style={[styles.songDuration, { color: colors.textSecondary }]}>
                      {song.duration}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Gradient masks matching current theme background */}
            <LinearGradient
              colors={[
                colors.background,
                isDark ? 'rgba(13, 17, 23, 0.7)' : 'rgba(247, 248, 250, 0.7)',
                'transparent',
              ]}
              style={styles.fadeMaskTop}
              pointerEvents="none"
            />
            <LinearGradient
              colors={[
                'transparent',
                isDark ? 'rgba(13, 17, 23, 0.7)' : 'rgba(247, 248, 250, 0.7)',
                colors.background,
              ]}
              style={styles.fadeMaskBottom}
              pointerEvents="none"
            />
          </View>

          {/* 3. Card Hero Oliva */}
          <View style={styles.heroCard}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>HINOS • LETRAS • CIFRAS</Text>
            </View>
            <Text style={styles.heroTitle}>Seu IGCGMusic 100% personalizado</Text>
            <Text style={styles.heroDescription}>
              Crie sua conta para ouvir seus hinos favoritos, ter seu Mix Personalizado e organizar
              suas playlists.
            </Text>
          </View>

          {/* 4. Botões de Ação */}
          <View style={styles.actionsContainer}>
            <Pressable
              onPress={handleCreateAccount}
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}>
              <Text style={styles.btnPrimaryText}>Criar minha conta</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.btnSecondary,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.borderSubtle,
                },
                pressed && styles.btnPressed,
              ]}>
              <Text style={[styles.btnSecondaryText, { color: colors.text }]}>
                Já tenho conta
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 12, default: 16 }),
    justifyContent: 'space-between',
  },

  /* Marca */
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  brandName: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },

  /* Prévia de hinos */
  previewContainer: {
    flex: 1,
    minHeight: 160,
    maxHeight: 360,
    marginVertical: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  track: {
    flexDirection: 'column',
  },
  batch: {
    gap: 10,
    paddingBottom: 10,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
    borderWidth: 1,
  },
  songNumber: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    width: 22,
  },
  songCover: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  songDetails: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  songTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  songSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  songDuration: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  fadeMaskTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 38,
    zIndex: 10,
  },
  fadeMaskBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 38,
    zIndex: 10,
  },

  /* Hero Card Oliva */
  heroCard: {
    backgroundColor: Colors.dark.olive,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4E5644',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.accent,
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontFamily: Fonts.extraBold,
    fontSize: 10.5,
    color: Colors.dark.accentInk,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    lineHeight: 29,
    color: '#F7F8FA',
    letterSpacing: -0.4,
    marginTop: 10,
    marginBottom: 8,
  },
  heroDescription: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#E6EADF',
  },

  /* Ações */
  actionsContainer: {
    marginTop: 14,
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: Colors.dark.accent,
    height: 52,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.dark.accentInk,
  },
  btnSecondary: {
    height: 52,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  btnSecondaryText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
