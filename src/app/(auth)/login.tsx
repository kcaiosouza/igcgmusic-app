import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, ChevronLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useApi } from '@/hooks/use-api';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { login } = useAuth();
  const { execute, loading: isSubmitting, authService } = useApi();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Focus states for input border highlights
  const [focusId, setFocusId] = useState(false);
  const [focusPw, setFocusPw] = useState(false);

  const isValid = identifier.trim().length >= 3 && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid || isSubmitting) {
      setErrorMessage('Por favor, preencha os campos corretamente.');
      return;
    }
    setErrorMessage('');
    setInfoMessage('');

    try {
      await execute(() => login(identifier, password));
      router.replace('/home');
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Erro ao fazer login. Verifique suas credenciais.'
      );
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage('');
    setInfoMessage('');
    const trimmed = identifier.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage('Digite seu e-mail no campo acima para recuperar sua senha.');
      return;
    }
    try {
      const res = await execute(() => authService.forgotPassword(trimmed));
      setInfoMessage(
        res?.message ||
          'Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao enviar solicitação de recuperação.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* 1. Cabeçalho Oliva Curvado com Efeito Sonoro */}
          <LinearGradient
            colors={['#667158', '#404638']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}>
            {/* Equalizer soundwave decorativa */}
            <Svg
              width={180}
              height={110}
              viewBox="0 0 190 120"
              fill="#FFFFFF"
              style={styles.soundwave}
              pointerEvents="none">
              <Rect x="0" y="60" width="16" height="60" rx="8" opacity="0.14" />
              <Rect x="26" y="20" width="16" height="100" rx="8" opacity="0.14" />
              <Rect x="52" y="44" width="16" height="76" rx="8" opacity="0.14" />
              <Rect x="78" y="0" width="16" height="120" rx="8" opacity="0.14" />
              <Rect x="104" y="36" width="16" height="84" rx="8" opacity="0.14" />
              <Rect x="130" y="70" width="16" height="50" rx="8" opacity="0.14" />
              <Rect x="156" y="28" width="16" height="92" rx="8" opacity="0.14" />
            </Svg>

            {/* Botão Voltar */}
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressedBtn]}
              accessibilityLabel="Voltar para tela inicial">
              <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>

            {/* Logotipo Oficial */}
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                contentFit="cover"
                accessibilityLabel="IGCGMusic Logo"
              />
            </View>

            <Text style={styles.headerTitle}>Bem-vindo de volta</Text>
            <Text style={styles.headerSubtitle}>Entre para continuar ouvindo seus hinos.</Text>
          </LinearGradient>

          {/* 2. Card Flutuante de Formulário */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            {/* Campo E-mail ou Usuário */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                E-mail ou usuário
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#151A22' : '#F0F2F5',
                    borderColor: focusId ? colors.accent : colors.borderSubtle,
                  },
                ]}>
                <Mail size={18} color={focusId ? colors.accent : '#8A93A3'} style={styles.inputIcon} />
                <TextInput
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (errorMessage) setErrorMessage('');
                    if (infoMessage) setInfoMessage('');
                  }}
                  onFocus={() => setFocusId(true)}
                  onBlur={() => setFocusId(false)}
                  placeholder="seu e-mail ou usuário"
                  placeholderTextColor="#7B8494"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  style={[styles.textInput, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Campo Senha */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Senha</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#151A22' : '#F0F2F5',
                    borderColor: focusPw ? colors.accent : colors.borderSubtle,
                  },
                ]}>
                <Lock size={18} color={focusPw ? colors.accent : '#8A93A3'} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage('');
                    if (infoMessage) setInfoMessage('');
                  }}
                  onFocus={() => setFocusPw(true)}
                  onBlur={() => setFocusPw(false)}
                  placeholder="Sua senha"
                  placeholderTextColor="#7B8494"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  onSubmitEditing={handleLogin}
                  style={[styles.textInput, { color: colors.text }]}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  hitSlop={8}>
                  {showPassword ? (
                    <EyeOff size={18} color="#8A93A3" />
                  ) : (
                    <Eye size={18} color="#8A93A3" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Esqueceu sua senha */}
            <Pressable onPress={handleForgotPassword} disabled={isSubmitting} style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: isDark ? '#AAB2BF' : '#656D76' }]}>
                Esqueceu sua senha?
              </Text>
            </Pressable>

            {/* Mensagens de Erro / Sucesso */}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {infoMessage ? (
              <Text style={[styles.infoText, { color: colors.accent }]}>{infoMessage}</Text>
            ) : null}

            {/* Botão Entrar no Formato PILL */}
            <Pressable
              onPress={handleLogin}
              disabled={!isValid || isSubmitting}
              style={({ pressed }) => [
                styles.pillButton,
                {
                  backgroundColor: colors.accent,
                  opacity: isValid && !isSubmitting ? 1 : 0.45,
                },
                pressed && isValid && !isSubmitting && styles.pressedBtn,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.accentInk} />
              ) : (
                <>
                  <Text style={styles.pillButtonText}>Entrar</Text>
                  <ArrowRight size={18} color={colors.accentInk} strokeWidth={2.4} />
                </>
              )}
            </Pressable>
          </View>

          {/* 3. Rodapé com Alternância para Cadastro */}
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <View style={styles.switchRow}>
              <Text style={[styles.switchPrompt, { color: colors.textSecondary }]}>
                Ainda não tem conta?{' '}
              </Text>
              <Pressable disabled={isSubmitting} onPress={() => router.replace('/signup')}>
                <Text style={[styles.switchLink, { color: colors.accent }]}>Criar conta</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 24,
  },

  /* Cabeçalho */
  header: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingBottom: 58,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  soundwave: {
    position: 'absolute',
    right: -10,
    bottom: -4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  logoWrapper: {
    marginTop: 18,
    marginBottom: 14,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  headerTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    color: '#E1E6D8',
    marginTop: 5,
  },

  /* Card Flutuante */
  card: {
    marginTop: -32,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-start',
    marginTop: -4,
    marginBottom: 14,
  },
  forgotText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#FF6B6B',
    marginBottom: 12,
  },
  infoText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    marginBottom: 12,
  },

  /* Botão PILL Padronizado */
  pillButton: {
    height: 52,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 4,
  },
  pillButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.dark.accentInk,
  },
  pressedBtn: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },

  /* Rodapé */
  footer: {
    marginTop: 26,
    paddingHorizontal: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchPrompt: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  switchLink: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
});
