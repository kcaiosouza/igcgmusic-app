import { router } from 'expo-router';
import { Home, Search } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Polygon,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';

import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ART_WIDTH = Math.min(SCREEN_WIDTH - 48, 360);
const ART_HEIGHT = (ART_WIDTH / 520) * 330;

export default function NotFoundScreen() {
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // Animações de levitação (lift) e pulso do feixe de luz (beam)
  const liftY = useSharedValue(18);
  const beamPulse = useSharedValue(0.72);

  useEffect(() => {
    liftY.value = withRepeat(
      withTiming(-12, {
        duration: 3000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );

    beamPulse.value = withRepeat(
      withTiming(1, {
        duration: 3000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [liftY, beamPulse]);

  const animatedWindowStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: -62 },
        { translateY: liftY.value },
        { rotate: '-24deg' },
      ],
    };
  });

  const animatedBeamStyle = useAnimatedStyle(() => {
    return {
      opacity: beamPulse.value,
    };
  });

  // Paleta da ilustração com suporte total a Dark e Light mode
  const beamColor1 = isDark
    ? 'rgba(190, 220, 200, 0.32)'
    : 'rgba(150, 170, 155, 0.36)';
  const beamColor2 = 'rgba(190, 220, 200, 0)';

  const cloudColor1 = isDark ? '#E9EEEA' : '#F4F5F4';
  const cloudColor2 = isDark ? '#8C9A92' : '#A3ABA6';

  const winBg = isDark ? '#364E40' : '#E3EEE7';
  const winEdge = isDark ? '#A2C9B1' : '#7F9D8A';

  const handleGoHome = () => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/');
    }
  };

  const handleGoSearch = () => {
    if (isAuthenticated) {
      router.replace('/(tabs)/search');
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 30,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Ilustração Central da Página Arrebatada */}
        <View style={[styles.artWrapper, { width: ART_WIDTH, height: ART_HEIGHT }]}>
          {/* Camada 1 (Fundo): Feixe de luz com animação de pulso */}
          <Animated.View style={[StyleSheet.absoluteFill, animatedBeamStyle]}>
            <Svg width="100%" height="100%" viewBox="0 0 520 330">
              <Defs>
                <SvgLinearGradient id="bm" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={beamColor1} />
                  <Stop offset="1" stopColor={beamColor2} />
                </SvgLinearGradient>
              </Defs>
              <Polygon
                points="205,92 315,92 440,320 80,320"
                fill="url(#bm)"
              />
            </Svg>
          </Animated.View>

          {/* Camada 2 (Meio): Janela do Navegador levitando em direção à nuvem */}
          <Animated.View
            style={[
              styles.floatingWindow,
              {
                backgroundColor: winBg,
                borderColor: winEdge,
              },
              animatedWindowStyle,
            ]}>
            {/* Barra superior da janela */}
            <View style={[styles.windowTitleBar, { borderBottomColor: winEdge }]}>
              <View style={styles.windowDotsRow}>
                <View style={[styles.windowDot, { backgroundColor: winEdge }]} />
                <View
                  style={[
                    styles.windowDot,
                    { backgroundColor: winEdge, opacity: 0.6 },
                  ]}
                />
                <View
                  style={[
                    styles.windowDot,
                    { backgroundColor: winEdge, opacity: 0.35 },
                  ]}
                />
              </View>
            </View>

            {/* Texto 404 centralizado */}
            <View style={styles.windowBody}>
              <Text style={[styles.windowCodeText, { color: colors.accent }]}>
                404
              </Text>
            </View>
          </Animated.View>

          {/* Camada 3 (Frente): Nuvem suave com gradiente radial */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 520 330">
              <Defs>
                <SvgRadialGradient
                  id="cl"
                  cx="50%"
                  cy="40%"
                  rx="70%"
                  ry="70%">
                  <Stop offset="0" stopColor={cloudColor1} />
                  <Stop offset="1" stopColor={cloudColor2} />
                </SvgRadialGradient>
              </Defs>

              {/* Sombra suave abaixo da nuvem */}
              <Ellipse
                cx="260"
                cy="96"
                rx="92"
                ry="9"
                fill="#000000"
                opacity={0.35}
              />

              {/* Bolhas da nuvem */}
              <G fill="url(#cl)">
                <Circle cx="190" cy="70" r="34" />
                <Circle cx="232" cy="46" r="42" />
                <Circle cx="286" cy="52" r="40" />
                <Circle cx="332" cy="74" r="32" />
                <Ellipse cx="262" cy="84" rx="100" ry="26" />
              </G>

              {/* Borda inferior sutil da nuvem */}
              <Ellipse
                cx="262"
                cy="94"
                rx="64"
                ry="6"
                fill={cloudColor2}
                opacity={0.55}
              />
            </Svg>
          </View>
        </View>

        {/* Código do Erro */}
        <Text style={[styles.codeBadge, { color: colors.textSecondary }]}>
          Erro 404
        </Text>

        {/* Título Principal */}
        <Text style={[styles.headline, { color: colors.text }]}>
          Essa página foi{'\n'}arrebatada... digo... não{'\n'}encontrada 😅
        </Text>

        {/* Mensagem Explicativa */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          O endereço que você abriu não existe mais ou nunca existiu. Vigiai:
          ainda dá tempo de voltar.
        </Text>

        {/* Botões de Ação */}
        <View style={styles.actionsRow}>
          {/* Botão Primário: Voltar ao início */}
          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.accent },
              pressed && styles.buttonPressed,
            ]}>
            <Home size={18} color="#04140A" strokeWidth={2.4} />
            <Text style={styles.primaryButtonText}>Voltar ao início</Text>
          </Pressable>

          {/* Botão Secundário: Buscar hinos */}
          <Pressable
            onPress={handleGoSearch}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderSubtle,
              },
              pressed && styles.buttonPressed,
            ]}>
            <Search size={18} color={colors.text} strokeWidth={2.2} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Buscar hinos
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  artWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  floatingWindow: {
    position: 'absolute',
    left: '50%',
    top: '46%',
    width: 124,
    height: 78,
    borderRadius: 12,
    borderWidth: 2.5,
    overflow: 'hidden',
    zIndex: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  windowTitleBar: {
    height: 20,
    borderBottomWidth: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  windowDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  windowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  windowBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  windowCodeText: {
    fontSize: 26,
    fontFamily: Fonts.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  codeBadge: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    marginTop: 6,
  },
  headline: {
    fontSize: 26,
    fontFamily: Fonts.extraBold,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 33,
    letterSpacing: -0.6,
    maxWidth: 360,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 330,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    shadowColor: '#04D361',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: '#04140A',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
