import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  Columns,
  Compass,
  Grape,
  HeartHandshake,
  Key,
  Shield,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BadgeSpec {
  key: string;
  name: string;
  description: string;
  IconComponent: React.ComponentType<any>;
  colors: [string, string];
  textColor: string;
}

export const BADGE_LIST: Record<string, BadgeSpec> = {
  primeiro_assinante: {
    key: 'primeiro_assinante',
    name: 'Primeiro Assinante',
    description: 'Um dos primeiros a apoiar a plataforma com uma assinatura ativa.',
    IconComponent: Sparkles,
    colors: ['#ffd700', '#ffa500'],
    textColor: '#FFFFFF',
  },
  semeador: {
    key: 'semeador',
    name: 'Semeador',
    description: 'Assinante plano base. Ajuda a espalhar a boa semente.',
    IconComponent: Sprout,
    colors: ['#12b886', '#099268'],
    textColor: '#FFFFFF',
  },
  cooperador: {
    key: 'cooperador',
    name: 'Cooperador',
    description: 'Assinante plano avançado. Coopera ativamente com o crescimento da missão.',
    IconComponent: HeartHandshake,
    colors: ['#fab005', '#e67e22'],
    textColor: '#FFFFFF',
  },
  founder: {
    key: 'founder',
    name: 'Founder',
    description: 'Membro fundador pioneiro da plataforma IGCG Music.',
    IconComponent: Award,
    colors: ['#845ef7', '#5f3dc4'],
    textColor: '#FFFFFF',
  },
  pioneiro: {
    key: 'pioneiro',
    name: 'Pioneiro',
    description: 'Um dos primeiros a trilhar o caminho na plataforma musical.',
    IconComponent: Compass,
    colors: ['#339af0', '#1c7ed6'],
    textColor: '#FFFFFF',
  },
  guardiao: {
    key: 'guardiao',
    name: 'Guardião',
    description: 'Protetor dos valores e da comunhão musical da comunidade.',
    IconComponent: Shield,
    colors: ['#868e96', '#495057'],
    textColor: '#FFFFFF',
  },
  videira: {
    key: 'videira',
    name: 'Videira',
    description: 'Membro que permanece conectado ao louvor e gera muitos frutos.',
    IconComponent: Grape,
    colors: ['#d6336c', '#a61e4d'],
    textColor: '#FFFFFF',
  },
  coluna: {
    key: 'coluna',
    name: 'Coluna',
    description: 'Membro de sustentação e referência espiritual na comunidade.',
    IconComponent: Columns,
    colors: ['#e64980', '#c2255c'],
    textColor: '#FFFFFF',
  },
  despenseiro: {
    key: 'despenseiro',
    name: 'Despenseiro',
    description: 'Administrador dedicado dos talentos e recursos na obra.',
    IconComponent: Key,
    colors: ['#ff922b', '#d9480f'],
    textColor: '#FFFFFF',
  },
};

export function getBadgesForUser(
  username?: string,
  currentPlanName?: string,
  customSpecialBadges?: string[]
): string[] {
  if (!username) return [];
  const cleanUsername = username.replace('@', '').toLowerCase().trim();

  const badges: string[] = [];

  // 1. Subscription-based badge
  if (currentPlanName) {
    const plan = currentPlanName.toLowerCase();
    if (plan === 'semeador') {
      badges.push('semeador');
    } else if (plan === 'cooperador') {
      badges.push('cooperador');
    }
  }

  // 2. Custom special badges or deterministic defaults
  if (customSpecialBadges && customSpecialBadges.length > 0) {
    badges.push(...customSpecialBadges);
  } else {
    if (
      cleanUsername === 'caio' ||
      cleanUsername === 'caiosouza' ||
      cleanUsername === 'admin'
    ) {
      badges.push('founder', 'coluna');
    } else if (cleanUsername === 'pioneiro' || cleanUsername.includes('pioneer')) {
      badges.push('pioneiro');
    } else if (cleanUsername.includes('guard') || cleanUsername === 'guardiao') {
      badges.push('guardiao');
    } else if (cleanUsername.includes('videira') || cleanUsername === 'videira') {
      badges.push('videira');
    } else if (cleanUsername.includes('coluna') || cleanUsername === 'coluna') {
      badges.push('coluna');
    } else if (cleanUsername.includes('despenseiro')) {
      badges.push('despenseiro');
    }

    if (
      cleanUsername !== 'caio' &&
      cleanUsername !== 'caiosouza' &&
      cleanUsername !== 'admin'
    ) {
      if (cleanUsername.length % 7 === 0) {
        badges.push('semeador');
      } else if (cleanUsername.length % 5 === 0) {
        badges.push('cooperador');
      }

      if (cleanUsername.length % 9 === 0) {
        badges.push('founder');
      } else if (cleanUsername.length % 11 === 0) {
        badges.push('pioneiro');
      }
    }
  }

  const uniqueBadges = Array.from(new Set(badges));
  if (uniqueBadges.includes('cooperador') && uniqueBadges.includes('semeador')) {
    return uniqueBadges.filter((b) => b !== 'semeador');
  }
  return uniqueBadges;
}

interface UserBadgesProps {
  username?: string;
  planName?: string;
  customSpecialBadges?: string[];
  mode?: 'pills' | 'cards';
}

export function UserBadges({
  username,
  planName,
  customSpecialBadges,
  mode = 'pills',
}: UserBadgesProps) {
  const theme = useTheme();
  const [selectedBadge, setSelectedBadge] = useState<BadgeSpec | null>(null);

  const badgeKeys = getBadgesForUser(username, planName, customSpecialBadges);

  if (badgeKeys.length === 0) {
    if (mode === 'cards') {
      return (
        <View style={[styles.emptyContainer, { borderColor: theme.border, backgroundColor: theme.cardSecondary }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Nenhuma condecoração ativa no momento. Conforme você apoia a plataforma e participa da comunidade, novas insígnias serão desbloqueadas!
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <>
      {mode === 'pills' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScrollContainer}>
          {badgeKeys.map((key) => {
            const spec = BADGE_LIST[key];
            if (!spec) return null;
            const Icon = spec.IconComponent;
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedBadge(spec)}
                style={({ pressed }) => [
                  styles.pillButton,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}>
                <LinearGradient
                  colors={spec.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pillIconCircle}>
                  <Icon size={12} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.pillLabel, { color: theme.text }]}>
                  {spec.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.cardsContainer}>
          {badgeKeys.map((key) => {
            const spec = BADGE_LIST[key];
            if (!spec) return null;
            const Icon = spec.IconComponent;
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedBadge(spec)}
                style={({ pressed }) => [
                  styles.cardItem,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  pressed && styles.buttonPressed,
                ]}>
                <LinearGradient
                  colors={spec.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIconCircle}>
                  <Icon size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {spec.name}
                  </Text>
                  <Text
                    style={[styles.cardDescription, { color: theme.textSecondary }]}
                    numberOfLines={2}>
                    {spec.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Modal de Detalhes da Condecoração */}
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedBadge(null)}
          />
          {selectedBadge && (
            <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Pressable
                style={styles.closeModalButton}
                onPress={() => setSelectedBadge(null)}
                hitSlop={12}>
                <X size={20} color={theme.textSecondary} />
              </Pressable>

              <LinearGradient
                colors={selectedBadge.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalBadgeIcon}>
                <selectedBadge.IconComponent size={38} color="#FFFFFF" />
              </LinearGradient>

              <Text style={[styles.modalBadgeTitle, { color: theme.text }]}>
                {selectedBadge.name}
              </Text>

              <View style={styles.modalActiveTag}>
                <Sparkles size={12} color={Colors.dark.accent} />
                <Text style={styles.modalActiveTagText}>Condecoração Ativa</Text>
              </View>

              <Text style={[styles.modalBadgeDescription, { color: theme.textSecondary }]}>
                {selectedBadge.description}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.modalConfirmButton,
                  { backgroundColor: Colors.dark.accent },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setSelectedBadge(null)}>
                <Text style={styles.modalConfirmButtonText}>Entendido</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pillsScrollContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  pillIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  cardsContainer: {
    gap: 12,
    width: '100%',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    marginBottom: 2,
  },
  cardDescription: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyContainer: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  closeModalButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalBadgeTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalActiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(4, 211, 97, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 14,
  },
  modalActiveTagText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.dark.accent,
  },
  modalBadgeDescription: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalConfirmButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#03200E',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
