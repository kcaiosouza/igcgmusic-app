import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Globe,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Shield,
  Sparkles,
  Trash2,
  User as UserIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getBadgesForUser,
  UserBadges,
} from '@/components/profile/user-badges';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { User } from '@/services/auth.service';

type ProfileTab = 'general' | 'plans' | 'address' | 'preferences';

const AVAILABLE_PLANS = [
  {
    id: 'plan-gratuito',
    name: 'Gratuito',
    price: 'R$ 0,00',
    benefits: [
      'Sem anúncios entre as faixas',
      'Acesso ao catálogo de hinos',
      'Somente online',
    ],
  },
  {
    id: 'plan-semeador',
    name: 'Semeador',
    price: 'R$ 4,99',
    benefits: [
      'Sem anúncios',
      'Badge exclusivo de Semeador',
      'Apoio direto à missão da plataforma',
      'Acesso antecipado a novidades',
    ],
  },
  {
    id: 'plan-cooperador',
    name: 'Cooperador',
    price: 'R$ 9,99',
    benefits: [
      'Sem anúncios',
      'Badge exclusivo de Cooperador',
      'Apoio fundamental ao crescimento',
      'Acesso antecipado a novos lançamentos',
      'Brindes e conteúdos exclusivos',
    ],
  },
];

const LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'Inglês', flag: '🇺🇸' },
  { code: 'es', name: 'Espanhol', flag: '🇪🇸' },
  { code: 'fr', name: 'Francês', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'de', name: 'Alemão', flag: '🇩🇪' },
];

interface AddressSectionProps {
  initialAddress?: User['address'] | null;
  onSave: (data: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    zipCode: string;
  }) => Promise<void>;
  theme: any;
}

function AddressSection({ initialAddress, onSave, theme }: AddressSectionProps) {
  const [street, setStreet] = useState(initialAddress?.street || '');
  const [number, setNumber] = useState(initialAddress?.number || '');
  const [complement, setComplement] = useState(initialAddress?.complement || '');
  const [neighborhood, setNeighborhood] = useState(initialAddress?.neighborhood || '');
  const [city, setCity] = useState(initialAddress?.city || '');
  const [state, setState] = useState(initialAddress?.state || '');
  const [zipCode, setZipCode] = useState(initialAddress?.zipCode || '');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const handleZipCodeChange = async (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    let display = raw;
    if (raw.length > 5) {
      display = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    setZipCode(display);

    if (raw.length === 8) {
      setIsSearchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await response.json();
        if (data && !data.erro) {
          if (data.logradouro) setStreet(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.localidade) setCity(data.localidade);
          if (data.uf) setState(data.uf);
        }
      } catch (err) {
        console.warn('Falha ao consultar CEP:', err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSavingAddress(true);
    try {
      await onSave({
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <MapPin size={18} color={Colors.dark.accent} />
          <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>
            Endereço de Faturamento
          </Text>
        </View>

        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          Preencha seu CEP para preenchimento automático das informações de endereço.
        </Text>

        <View style={styles.formGroup}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              CEP
            </Text>
            <View style={styles.cepInputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={zipCode}
                onChangeText={handleZipCodeChange}
                placeholder="00000-000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
              {isSearchingCep && (
                <ActivityIndicator
                  size="small"
                  color={Colors.dark.accent}
                  style={styles.cepLoader}
                />
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              LOGRADOURO / RUA
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={street}
              onChangeText={setStreet}
              placeholder="Rua, Avenida..."
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                NÚMERO
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={number}
                onChangeText={setNumber}
                placeholder="123"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1.5 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                COMPLEMENTO
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={complement}
                onChangeText={setComplement}
                placeholder="Apto, Bloco"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              BAIRRO
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="Bairro"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 2 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                CIDADE
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={city}
                onChangeText={setCity}
                placeholder="Cidade"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                ESTADO
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.cardSecondary,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={state}
                onChangeText={setState}
                placeholder="UF"
                placeholderTextColor={theme.textSecondary}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={isSavingAddress}
            style={({ pressed }) => [
              styles.primaryPillButton,
              { backgroundColor: Colors.dark.accent },
              pressed && styles.buttonPressed,
            ]}>
            {isSavingAddress ? (
              <ActivityIndicator size="small" color="#03200E" />
            ) : (
              <Text style={styles.primaryPillButtonText}>
                Salvar Endereço
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {
    user,
    logout,
    updateAddress,
    updatePreferredLanguages,
    upgradePlan,
    deleteAccount,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ProfileTab>('general');

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Action Loading States
  const [isUpdatingPlan, setIsUpdatingPlan] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveAddress = async (data: Parameters<typeof updateAddress>[0]) => {
    setFeedback(null);
    try {
      await updateAddress(data);
      showFeedback('success', 'Endereço atualizado com sucesso!');
    } catch {
      showFeedback('error', 'Falha ao salvar o endereço.');
    }
  };

  const handleLanguageToggle = async (langCode: string) => {
    const current = user?.preferredLanguages || ['pt'];
    let next: string[];
    if (current.includes(langCode)) {
      if (current.length === 1) {
        showFeedback('error', 'Mantenha ao menos um idioma selecionado.');
        return;
      }
      next = current.filter((l) => l !== langCode);
    } else {
      next = [...current, langCode];
    }

    try {
      await updatePreferredLanguages(next);
      showFeedback('success', 'Preferências de idioma salvas!');
    } catch {
      showFeedback('error', 'Erro ao atualizar idiomas.');
    }
  };

  const handlePlanUpgrade = async (plan: (typeof AVAILABLE_PLANS)[number]) => {
    setIsUpdatingPlan(plan.id);
    setFeedback(null);
    try {
      await upgradePlan(
        plan.id,
        plan.name,
        plan.price.replace('R$ ', '').replace(',', '.')
      );
      showFeedback('success', `Plano alterado para ${plan.name}!`);
    } catch {
      showFeedback('error', 'Erro ao atualizar assinatura.');
    } finally {
      setIsUpdatingPlan(null);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza de que deseja encerrar sua sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (e) {
              console.warn('Erro ao sair:', e);
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta Permanentemente',
      'Em conformidade com a LGPD, TODOS os seus dados pessoais, histórico, favoritos e playlists serão apagados de forma irreversível.\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Definitivamente',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAccount(true);
            try {
              await deleteAccount();
            } catch {
              showFeedback('error', 'Erro ao excluir conta.');
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const currentPlanName = user?.plan?.name || 'Gratuito';
  const userBadges = getBadgesForUser(
    user?.username,
    currentPlanName,
    user?.customSpecialBadges
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Toast de Feedback */}
        {feedback && (
          <View
            style={[
              styles.feedbackBanner,
              feedback.type === 'success'
                ? styles.feedbackSuccess
                : styles.feedbackError,
            ]}>
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} color="#04D361" />
            ) : (
              <AlertCircle size={16} color="#FF4D4D" />
            )}
            <Text
              style={[
                styles.feedbackText,
                {
                  color: feedback.type === 'success' ? '#04D361' : '#FF4D4D',
                },
              ]}>
              {feedback.msg}
            </Text>
          </View>
        )}

        {/* HERO HEADER */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(4, 211, 97, 0.15)', 'rgba(32, 138, 239, 0.05)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroAvatarContainer}>
            <View style={styles.heroAvatarRing}>
              <UserIcon size={36} color="#FFFFFF" />
            </View>
            {userBadges.length > 0 && (
              <View style={styles.heroBadgeFloating}>
                <Sparkles size={12} color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text style={[styles.heroName, { color: theme.text }]} numberOfLines={1}>
            {user?.name || 'Membro IGCG'}
          </Text>

          <Text style={[styles.heroUsername, { color: theme.textSecondary }]}>
            @{user?.username || 'usuario'}
          </Text>

          <View style={styles.heroTagsRow}>
            <View style={[styles.planPill, { backgroundColor: 'rgba(4, 211, 97, 0.12)' }]}>
              <Shield size={12} color={Colors.dark.accent} />
              <Text style={styles.planPillText}>
                {currentPlanName.toUpperCase()}
              </Text>
            </View>

            {user?.email && (
              <View style={[styles.emailPill, { backgroundColor: theme.cardSecondary }]}>
                <Mail size={12} color={theme.textSecondary} />
                <Text
                  style={[styles.emailPillText, { color: theme.textSecondary }]}
                  numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Badges Preview Row */}
          {userBadges.length > 0 && (
            <View style={styles.heroBadgesSection}>
              <UserBadges
                username={user?.username}
                planName={currentPlanName}
                customSpecialBadges={user?.customSpecialBadges}
                mode="pills"
              />
            </View>
          )}
        </View>

        {/* SEGMENTED PILL NAVIGATION */}
        <View style={[styles.tabsBar, { backgroundColor: theme.cardSecondary }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}>
            <Pressable
              onPress={() => setActiveTab('general')}
              style={[
                styles.tabPill,
                activeTab === 'general' && {
                  backgroundColor: Colors.dark.accent,
                },
              ]}>
              <Text
                style={[
                  styles.tabPillText,
                  {
                    color:
                      activeTab === 'general' ? '#03200E' : theme.textSecondary,
                  },
                ]}>
                Visão Geral
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('plans')}
              style={[
                styles.tabPill,
                activeTab === 'plans' && {
                  backgroundColor: Colors.dark.accent,
                },
              ]}>
              <Text
                style={[
                  styles.tabPillText,
                  {
                    color:
                      activeTab === 'plans' ? '#03200E' : theme.textSecondary,
                  },
                ]}>
                Planos & Missão
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('address')}
              style={[
                styles.tabPill,
                activeTab === 'address' && {
                  backgroundColor: Colors.dark.accent,
                },
              ]}>
              <Text
                style={[
                  styles.tabPillText,
                  {
                    color:
                      activeTab === 'address' ? '#03200E' : theme.textSecondary,
                  },
                ]}>
                Endereço
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('preferences')}
              style={[
                styles.tabPill,
                activeTab === 'preferences' && {
                  backgroundColor: Colors.dark.accent,
                },
              ]}>
              <Text
                style={[
                  styles.tabPillText,
                  {
                    color:
                      activeTab === 'preferences'
                        ? '#03200E'
                        : theme.textSecondary,
                  },
                ]}>
                Preferências & Conta
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* TAB 1: VISÃO GERAL */}
        {activeTab === 'general' && (
          <View style={styles.sectionContainer}>
            {/* Dados Pessoais */}
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <UserIcon size={18} color={Colors.dark.accent} />
                <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>
                  Dados da Conta
                </Text>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoField}>
                  <Text style={[styles.infoFieldLabel, { color: theme.textSecondary }]}>
                    NOME COMPLETO
                  </Text>
                  <Text style={[styles.infoFieldValue, { color: theme.text }]}>
                    {user?.name || 'Não informado'}
                  </Text>
                </View>

                <View style={styles.infoField}>
                  <Text style={[styles.infoFieldLabel, { color: theme.textSecondary }]}>
                    USUÁRIO
                  </Text>
                  <Text style={[styles.infoFieldValue, { color: theme.text }]}>
                    @{user?.username || 'usuario'}
                  </Text>
                </View>

                <View style={styles.infoField}>
                  <Text style={[styles.infoFieldLabel, { color: theme.textSecondary }]}>
                    DATA DE NASCIMENTO
                  </Text>
                  <Text style={[styles.infoFieldValue, { color: theme.text }]}>
                    {user?.birthDate
                      ? new Date(user.birthDate).toLocaleDateString('pt-BR')
                      : 'Não informada'}
                  </Text>
                </View>

                <View style={styles.infoField}>
                  <Text style={[styles.infoFieldLabel, { color: theme.textSecondary }]}>
                    MEMBRO DESDE
                  </Text>
                  <Text style={[styles.infoFieldValue, { color: theme.text }]}>
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                      : 'Ativo'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Badges / Condecorações */}
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Sparkles size={18} color="#FFD700" />
                <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>
                  Condecorações ({userBadges.length})
                </Text>
              </View>

              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Insígnias exclusivas que você conquistou pela sua participação e apoio. Toque em qualquer condecoração para ver detalhes.
              </Text>

              <UserBadges
                username={user?.username}
                planName={currentPlanName}
                customSpecialBadges={user?.customSpecialBadges}
                mode="cards"
              />
            </View>

            {/* CODIGO APENAS PARA TESTAR ROTAS INEXISTENTES */}
            <Pressable
              onPress={() => router.push('/rota-inexistente-teste' as any)}
              style={({ pressed }) => [
                styles.testRouteButton,
                {
                  backgroundColor: theme.cardSecondary,
                  borderColor: theme.border,
                },
                pressed && styles.buttonPressed,
              ]}>
              <AlertCircle size={18} color={theme.textSecondary} />
              <Text style={[styles.testRouteButtonText, { color: theme.text }]}>
                Testar tela 404 (Rota Inexistente)
              </Text>
            </Pressable>

          </View>
        )}

        {/* TAB 2: PLANOS & MISSÃO */}
        {activeTab === 'plans' && (
          <View style={styles.sectionContainer}>
            {/* Card de Missão */}
            <View
              style={[
                styles.missionCard,
                {
                  backgroundColor: 'rgba(4, 211, 97, 0.08)',
                  borderColor: 'rgba(4, 211, 97, 0.25)',
                },
              ]}>
              <Heart size={20} color={Colors.dark.accent} />
              <Text style={[styles.missionText, { color: theme.text }]}>
                Mais do que uma assinatura, este é um compromisso com uma missão.
                Ao apoiar o IGCG Music, você fortalece o desenvolvimento de novos
                recursos e ajuda a propagar os hinos cristãos.
              </Text>
              <Text style={styles.missionNotice}>
                💚 Sem anúncios. Sempre. Sua assinatura existe para fortalecer a
                missão.
              </Text>
            </View>

            {/* Lista dos Planos */}
            <View style={styles.plansList}>
              {AVAILABLE_PLANS.map((plan) => {
                const isActive =
                  currentPlanName.toLowerCase() === plan.name.toLowerCase();
                const isCurrentUpdating = isUpdatingPlan === plan.id;

                return (
                  <View
                    key={plan.id}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: isActive
                          ? Colors.dark.accent
                          : theme.border,
                        borderWidth: isActive ? 2 : 1,
                      },
                    ]}>
                    <View style={styles.planCardHeader}>
                      <View>
                        <Text style={[styles.planCardName, { color: theme.text }]}>
                          {plan.name}
                        </Text>
                        <View style={styles.planPriceRow}>
                          <Text style={[styles.planCardPrice, { color: theme.text }]}>
                            {plan.price}
                          </Text>
                          <Text style={[styles.planCardPricePeriod, { color: theme.textSecondary }]}>
                            /mês
                          </Text>
                        </View>
                      </View>

                      {isActive && (
                        <View style={styles.activePlanBadge}>
                          <Check size={12} color="#03200E" />
                          <Text style={styles.activePlanBadgeText}>Atual</Text>
                        </View>
                      )}
                    </View>

                    {/* Benefícios */}
                    <View style={styles.benefitsList}>
                      {plan.benefits.map((benefit, i) => (
                        <View key={i} style={styles.benefitItem}>
                          <Check size={14} color={Colors.dark.accent} />
                          <Text style={[styles.benefitText, { color: theme.textSecondary }]}>
                            {benefit}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Botão de Ação do Plano */}
                    <Pressable
                      disabled={isActive || isCurrentUpdating}
                      onPress={() => handlePlanUpgrade(plan)}
                      style={({ pressed }) => [
                        styles.planActionButton,
                        isActive
                          ? { backgroundColor: theme.cardSecondary }
                          : { backgroundColor: Colors.dark.accent },
                        pressed && styles.buttonPressed,
                      ]}>
                      {isCurrentUpdating ? (
                        <ActivityIndicator size="small" color="#03200E" />
                      ) : (
                        <Text
                          style={[
                            styles.planActionButtonText,
                            {
                              color: isActive
                                ? theme.textSecondary
                                : '#03200E',
                            },
                          ]}>
                          {isActive ? 'Seu Plano Atual' : 'Apoiar com este Plano'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* TAB 3: ENDEREÇO */}
        {activeTab === 'address' && (
          <AddressSection
            key={user?.addressId || user?.id || 'addr'}
            initialAddress={user?.address}
            onSave={handleSaveAddress}
            theme={theme}
          />
        )}

        {/* TAB 4: PREFERÊNCIAS & CONTA */}
        {activeTab === 'preferences' && (
          <View style={styles.sectionContainer}>
            {/* Idiomas do Feed */}
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Globe size={18} color={Colors.dark.accent} />
                <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>
                  Idiomas de Preferência
                </Text>
              </View>

              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                Selecione os idiomas em que você deseja receber recomendações e hinos na sua página inicial.
              </Text>

              <View style={styles.languagesGrid}>
                {LANGUAGES.map((lang) => {
                  const isSelected = (
                    user?.preferredLanguages || ['pt']
                  ).includes(lang.code);

                  return (
                    <Pressable
                      key={lang.code}
                      onPress={() => handleLanguageToggle(lang.code)}
                      style={({ pressed }) => [
                        styles.languageChip,
                        {
                          backgroundColor: isSelected
                            ? 'rgba(4, 211, 97, 0.12)'
                            : theme.cardSecondary,
                          borderColor: isSelected
                            ? Colors.dark.accent
                            : theme.border,
                        },
                        pressed && styles.buttonPressed,
                      ]}>
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <Text
                        style={[
                          styles.languageName,
                          {
                            color: isSelected
                              ? Colors.dark.accent
                              : theme.text,
                          },
                        ]}>
                        {lang.name}
                      </Text>
                      {isSelected && (
                        <Check size={14} color={Colors.dark.accent} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Gerenciamento de Conta & LGPD */}
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Shield size={18} color={Colors.dark.accent} />
                <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>
                  Sessão & Privacidade
                </Text>
              </View>

              {/* Botão Sair da Conta */}
              <Pressable
                onPress={handleLogout}
                disabled={isLoggingOut}
                style={({ pressed }) => [
                  styles.logoutPillButton,
                  pressed && styles.buttonPressed,
                ]}>
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FF4D4D" />
                ) : (
                  <>
                    <LogOut size={18} color="#FF4D4D" />
                    <Text style={styles.logoutPillButtonText}>
                      Sair da Conta
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Zona de Perigo / LGPD */}
              <View style={styles.dangerZoneBox}>
                <Text style={styles.dangerTitle}>Zona de Perigo (LGPD)</Text>
                <Text style={[styles.dangerDescription, { color: theme.textSecondary }]}>
                  Ao excluir sua conta, todos os seus dados, histórico e listas serão apagados definitivamente do servidor.
                </Text>

                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  style={({ pressed }) => [
                    styles.deleteAccountButton,
                    pressed && styles.buttonPressed,
                  ]}>
                  {isDeletingAccount ? (
                    <ActivityIndicator size="small" color="#FF4D4D" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#FF4D4D" />
                      <Text style={styles.deleteAccountButtonText}>
                        Excluir Minha Conta
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(4, 211, 97, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(4, 211, 97, 0.3)',
  },
  feedbackError: {
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  feedbackText: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    flex: 1,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  heroAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  heroAvatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(4, 211, 97, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.accent,
  },
  heroBadgeFloating: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFD700',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D0D12',
  },
  heroName: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 2,
  },
  heroUsername: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  heroTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  planPillText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: Colors.dark.accent,
    letterSpacing: 0.5,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  emailPillText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  heroBadgesSection: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  tabsBar: {
    borderRadius: 16,
    padding: 6,
    marginBottom: 20,
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  tabPillText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  sectionContainer: {
    gap: 16,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
  },
  cardSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  infoGrid: {
    gap: 14,
  },
  infoField: {
    gap: 2,
  },
  infoFieldLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  infoFieldValue: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  missionCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 10,
  },
  missionText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  missionNotice: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.dark.accent,
  },
  plansList: {
    gap: 14,
  },
  planCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planCardName: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  planCardPrice: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
  },
  planCardPricePeriod: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  activePlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.accent,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  activePlanBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    color: '#03200E',
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    flex: 1,
  },
  planActionButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planActionButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  formGroup: {
    gap: 12,
  },
  inputContainer: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
  cepInputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  cepLoader: {
    position: 'absolute',
    right: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryPillButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPillButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#03200E',
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  languageFlag: {
    fontSize: 16,
  },
  languageName: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  logoutPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.25)',
    marginBottom: 20,
  },
  logoutPillButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#FF4D4D',
  },
  dangerZoneBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 77, 77, 0.2)',
    paddingTop: 16,
    gap: 8,
  },
  dangerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#FF4D4D',
  },
  dangerDescription: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 77, 77, 0.08)',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  deleteAccountButtonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: '#FF4D4D',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  testRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  testRouteButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
});
