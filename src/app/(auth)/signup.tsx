import { useRouter } from 'expo-router';
import {
  ArrowRight,
  AtSign,
  Calendar,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Heart,
  ListMusic,
  Lock,
  Mail,
  Sparkles,
  User,
} from 'lucide-react-native';
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

import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useApi } from '@/hooks/use-api';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { register } = useAuth();
  const { execute, loading: isSubmitting } = useApi();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Focus tracking
  const [focusName, setFocusName] = useState(false);
  const [focusUser, setFocusUser] = useState(false);
  const [focusMail, setFocusMail] = useState(false);
  const [focusBirth, setFocusBirth] = useState(false);
  const [focusPw, setFocusPw] = useState(false);
  const [focusPw2, setFocusPw2] = useState(false);

  // Auto-format date DD/MM/AAAA
  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    }
    setBirthDate(formatted);
    if (errorMessage) setErrorMessage('');
  };

  // Validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const isBirthValid = birthDate.length === 10;
  const isPasswordMatch = password.length > 0 && password === confirmPassword;

  // Password strength calculation
  const getPasswordScore = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/\d/.test(pw) && /[a-zA-Z]/.test(pw)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pw) || (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && pw.length >= 8)) {
      score += 1;
    }
    return score;
  };

  const strengthScore = getPasswordScore(password);
  const strengthLevels = [
    { color: '#FF6B6B', label: 'Muito fraca' },
    { color: '#FF6B6B', label: 'Fraca' },
    { color: '#F0B429', label: 'Média' },
    { color: '#4ADE80', label: 'Boa' },
    { color: '#04D361', label: 'Forte' },
  ];
  const currentStrength = strengthLevels[strengthScore];

  const isValid =
    fullName.trim().length >= 3 &&
    username.trim().length >= 3 &&
    isEmailValid &&
    isBirthValid &&
    password.length >= 6 &&
    isPasswordMatch &&
    acceptedTerms;

  const handleSignup = async () => {
    if (isSubmitting) return;

    if (fullName.trim().length < 3) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    if (cleanUsername.length < 3) {
      setErrorMessage('O usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      setErrorMessage(
        'O nome de usuário não pode conter espaços ou caracteres especiais (use apenas letras, números, hífen ou sublinhado).'
      );
      return;
    }

    if (!isEmailValid) {
      setErrorMessage('Insira um e-mail válido.');
      return;
    }

    if (!isBirthValid) {
      setErrorMessage('Informe sua data de nascimento (DD/MM/AAAA).');
      return;
    }

    const [dayStr, monthStr, yearStr] = birthDate.split('/');
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    if (
      isNaN(dateObj.getTime()) ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 1900 ||
      year > new Date().getFullYear()
    ) {
      setErrorMessage('Data de nascimento inválida.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!isPasswordMatch) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage('Você precisa concordar com os Termos de Uso.');
      return;
    }

    setErrorMessage('');

    try {
      await execute(() =>
        register({
          name: fullName.trim(),
          email: email.trim(),
          username: cleanUsername,
          password,
          birthDate: dateObj.toISOString(),
          preferredLanguages: ['pt'],
        })
      );
      router.replace('/home');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao realizar cadastro.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* 1. Header com Navegação e Indicador de Etapa */}
          <View style={styles.topNavRow}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                pressed && styles.pressedBtn,
              ]}
              accessibilityLabel="Voltar para tela inicial">
              <ChevronLeft size={22} color={colors.text} strokeWidth={2.5} />
            </Pressable>

            <View style={[styles.stepBar, { backgroundColor: colors.borderSubtle }]}>
              <View style={[styles.stepFill, { backgroundColor: colors.accent }]} />
            </View>
          </View>

          {/* Badge NOVIDADE */}
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.badgeText, { color: colors.accentInk }]}>NOVIDADE</Text>
          </View>

          {/* Títulos */}
          <Text style={[styles.mainTitle, { color: colors.text }]}>Crie sua conta</Text>
          <Text style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
            Leva menos de um minuto e é grátis.
          </Text>

          {/* Perks Horizontais com a Cor Oliva Oficial */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.perksContainer}>
            <View style={[styles.perkPill, { backgroundColor: colors.olive }]}>
              <Heart size={15} color="#7DFFB0" strokeWidth={2.2} />
              <Text style={styles.perkText}>Favoritos</Text>
            </View>
            <View style={[styles.perkPill, { backgroundColor: colors.olive }]}>
              <Sparkles size={15} color="#7DFFB0" strokeWidth={2.2} />
              <Text style={styles.perkText}>Mix Personalizado</Text>
            </View>
            <View style={[styles.perkPill, { backgroundColor: colors.olive }]}>
              <ListMusic size={15} color="#7DFFB0" strokeWidth={2.2} />
              <Text style={styles.perkText}>Playlists</Text>
            </View>
          </ScrollView>

          {/* 2. Card de Formulário */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            {/* Campo Nome Completo */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nome completo</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#151A22' : '#F0F2F5',
                    borderColor: focusName ? colors.accent : colors.borderSubtle,
                  },
                ]}>
                <User
                  size={18}
                  color={focusName ? colors.accent : '#8A93A3'}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onFocus={() => setFocusName(true)}
                  onBlur={() => setFocusName(false)}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#7B8494"
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  style={[styles.textInput, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Campo Usuário */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Usuário</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#151A22' : '#F0F2F5',
                    borderColor: focusUser ? colors.accent : colors.borderSubtle,
                  },
                ]}>
                <AtSign
                  size={18}
                  color={focusUser ? colors.accent : '#8A93A3'}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onFocus={() => setFocusUser(true)}
                  onBlur={() => setFocusUser(false)}
                  placeholder="Ex: meunome"
                  placeholderTextColor="#7B8494"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  style={[styles.textInput, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Campo E-mail */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>E-mail</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#151A22' : '#F0F2F5',
                    borderColor: focusMail ? colors.accent : colors.borderSubtle,
                  },
                ]}>
                <Mail
                  size={18}
                  color={focusMail ? colors.accent : '#8A93A3'}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onFocus={() => setFocusMail(true)}
                  onBlur={() => setFocusMail(false)}
                  placeholder="voce@exemplo.com"
                  placeholderTextColor="#7B8494"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  style={[styles.textInput, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Campo Data de Nascimento (antes da senha) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Data de nascimento
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#151A22' : '#F0F2F5',
                    borderColor: focusBirth ? colors.accent : colors.borderSubtle,
                  },
                ]}>
                <Calendar
                  size={18}
                  color={focusBirth ? colors.accent : '#8A93A3'}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={birthDate}
                  onChangeText={handleDateChange}
                  onFocus={() => setFocusBirth(true)}
                  onBlur={() => setFocusBirth(false)}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#7B8494"
                  keyboardType="number-pad"
                  maxLength={10}
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
                <Lock
                  size={18}
                  color={focusPw ? colors.accent : '#8A93A3'}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onFocus={() => setFocusPw(true)}
                  onBlur={() => setFocusPw(false)}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#7B8494"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isSubmitting}
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

            {/* Campo Confirmar Senha */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Confirmar senha
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: isDark ? '#151A22' : '#F0F2F5',
                    borderColor:
                      confirmPassword && !isPasswordMatch
                        ? '#FF6B6B'
                        : focusPw2
                          ? colors.accent
                          : colors.borderSubtle,
                  },
                ]}>
                <Lock
                  size={18}
                  color={focusPw2 ? colors.accent : '#8A93A3'}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  onFocus={() => setFocusPw2(true)}
                  onBlur={() => setFocusPw2(false)}
                  placeholder="Repita a senha"
                  placeholderTextColor="#7B8494"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isSubmitting}
                  style={[styles.textInput, { color: colors.text }]}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.eyeBtn}
                  hitSlop={8}>
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#8A93A3" />
                  ) : (
                    <Eye size={18} color="#8A93A3" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Medidor de Força de Senha */}
            <View style={styles.meterContainer}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < strengthScore;
                return (
                  <View
                    key={`meter-${index}`}
                    style={[
                      styles.meterBar,
                      {
                        backgroundColor: isFilled
                          ? currentStrength.color
                          : isDark
                            ? '#282E3A'
                            : '#E1E4E8',
                      },
                    ]}
                  />
                );
              })}
            </View>
            <Text style={[styles.meterHint, { color: colors.textSecondary }]}>
              {password
                ? `Senha: ${currentStrength.label}`
                : 'Use 6+ caracteres, com números e letras.'}
            </Text>

            {/* Termos de Uso (Checkbox customizado) */}
            <Pressable
              disabled={isSubmitting}
              onPress={() => setAcceptedTerms((prev) => !prev)}
              style={styles.termsRow}>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: acceptedTerms ? colors.accent : colors.borderSubtle,
                    backgroundColor: acceptedTerms ? colors.accent : 'transparent',
                  },
                ]}>
                {acceptedTerms && <Check size={14} color={colors.accentInk} strokeWidth={3} />}
              </View>
              <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                Li e concordo com os{' '}
                <Text style={{ color: colors.text, fontFamily: Fonts.bold }}>Termos de Uso</Text> e a{' '}
                <Text style={{ color: colors.text, fontFamily: Fonts.bold }}>
                  Política de Privacidade
                </Text>
                .
              </Text>
            </Pressable>

            {/* Mensagem de Erro */}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            {/* Botão Criar Conta no Formato PILL */}
            <Pressable
              onPress={handleSignup}
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
                  <Text style={styles.pillButtonText}>Criar conta</Text>
                  <ArrowRight size={18} color={colors.accentInk} strokeWidth={2.4} />
                </>
              )}
            </Pressable>
          </View>

          {/* 3. Rodapé com Alternância para Login */}
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <View style={styles.switchRow}>
              <Text style={[styles.switchPrompt, { color: colors.textSecondary }]}>
                Já tem uma conta?{' '}
              </Text>
              <Pressable disabled={isSubmitting} onPress={() => router.replace('/login')}>
                <Text style={[styles.switchLink, { color: colors.accent }]}>Entrar</Text>
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
    paddingHorizontal: 20,
  },

  /* Top Navigation */
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stepFill: {
    width: '100%',
    height: '100%',
  },

  /* Badge */
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  badgeText: {
    fontFamily: Fonts.extraBold,
    fontSize: 10.5,
    letterSpacing: 1,
  },

  /* Títulos */
  mainTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14.5,
    marginBottom: 16,
  },

  /* Perks */
  perksContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  perkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  perkText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  /* Card */
  card: {
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
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 7,
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

  /* Medidor */
  meterContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
    marginBottom: 6,
  },
  meterBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  meterHint: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    marginBottom: 16,
  },

  /* Checkbox de Termos */
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: '#FF6B6B',
    marginBottom: 12,
  },

  /* Botão PILL */
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
