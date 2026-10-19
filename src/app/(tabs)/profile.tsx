import { LogOut, User as UserIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza de que deseja encerrar a sua sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await logout();
            } catch (err) {
              console.warn('Erro ao sair da conta:', err);
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 80 },
      ]}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.content}>
        {/* Card do Usuário */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <UserIcon size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || 'Membro IGCG'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email || 'usuario@igcg.org.br'}
          </Text>
        </View>

        {/* Botão Sair da Conta / Exit */}
        <Pressable
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={({ pressed }) => [
            styles.exitButton,
            pressed && styles.exitButtonPressed,
          ]}>
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#FF4D4D" />
          ) : (
            <>
              <LogOut size={20} color="#FF4D4D" />
              <Text style={styles.exitText}>Sair da Conta</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D12',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  userCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(32, 138, 239, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#208AEF',
  },
  userName: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.25)',
  },
  exitButtonPressed: {
    backgroundColor: 'rgba(255, 77, 77, 0.2)',
    transform: [{ scale: 0.98 }],
  },
  exitText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#FF4D4D',
  },
});
