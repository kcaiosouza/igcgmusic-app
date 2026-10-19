import { useFocusEffect, useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  // Prevent Android hardware back button from returning to Login/Signup/Welcome
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        return true;
      });
      return () => subscription.remove();
    }, [])
  );

  const handleExit = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.content}>
          <Text style={[styles.greetingLabel, { color: colors.textSecondary }]}>
            Conectado como
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || user?.username || 'Usuário'}
          </Text>

          <Pressable
            onPress={handleExit}
            style={({ pressed }) => [
              styles.exitButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderSubtle,
              },
              pressed && styles.exitButtonPressed,
            ]}>
            <LogOut size={18} color="#FF6B6B" strokeWidth={2.2} />
            <Text style={styles.exitButtonText}>Sair</Text>
          </Pressable>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  greetingLabel: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginBottom: 6,
  },
  userName: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 32,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  exitButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#FF6B6B',
  },
  exitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
