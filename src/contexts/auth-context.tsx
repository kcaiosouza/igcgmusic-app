import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { setApiAuthToken, setOnUnauthorizedCallback } from '@/services/api';
import {
  authService,
  normalizeUser,
  RegisterPayload,
  User,
} from '@/services/auth.service';

const AUTH_TOKEN_KEY = 'igcgmusic_auth_token';
const AUTH_USER_KEY = 'igcgmusic_auth_user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateAddress: (addressData: any) => Promise<void>;
  updatePreferredLanguages: (languages: string[]) => Promise<void>;
  upgradePlan: (planId: string, planName: string, price: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((u: User | null) => {
    setUserState(normalizeUser(u));
  }, []);

  const clearSession = useCallback(async () => {
    setApiAuthToken(null);
    setToken(null);
    setUserState(null);
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
    } catch (e) {
      console.warn('Failed to clear auth storage:', e);
    }
  }, []);

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      clearSession();
    });
    return () => {
      setOnUnauthorizedCallback(null);
    };
  }, [clearSession]);

  useEffect(() => {
    let isMounted = true;

    const loadStoredAuth = async () => {
      try {
        const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([
          AUTH_TOKEN_KEY,
          AUTH_USER_KEY,
        ]);

        if (storedToken && isMounted) {
          setApiAuthToken(storedToken);
          setToken(storedToken);

          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              // Ignore corrupted cache
            }
          }

          try {
            const freshUser = await authService.getMe();
            if (isMounted && freshUser) {
              setUser(freshUser);
              await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(freshUser));
            }
          } catch (meErr) {
            console.warn('Could not refresh user profile:', meErr);
          }
        }
      } catch (e) {
        console.warn('Failed to restore auth session:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStoredAuth();

    return () => {
      isMounted = false;
    };
  }, [setUser]);

  const login = useCallback(
    async (identifier: string, password: string): Promise<User> => {
      const { user: loggedUser, token: authToken } = await authService.login(identifier, password);
      setApiAuthToken(authToken);
      setToken(authToken);
      setUser(loggedUser);

      await AsyncStorage.multiSet([
        [AUTH_TOKEN_KEY, authToken],
        [AUTH_USER_KEY, JSON.stringify(loggedUser)],
      ]);

      return loggedUser;
    },
    [setUser]
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<User> => {
      const { user: registeredUser, token: authToken } = await authService.register(payload);
      setApiAuthToken(authToken);
      setToken(authToken);
      setUser(registeredUser);

      await AsyncStorage.multiSet([
        [AUTH_TOKEN_KEY, authToken],
        [AUTH_USER_KEY, JSON.stringify(registeredUser)],
      ]);

      return registeredUser;
    },
    [setUser]
  );

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(freshUser));
    } catch (e) {
      console.warn('Failed to refresh profile:', e);
    }
  }, [token, setUser]);

  const updateAddress = useCallback(
    async (addressData: any) => {
      if (!user) return;
      try {
        const res = await authService.updateAddress(addressData);
        const updatedUser = {
          ...user,
          address: res,
          addressId: res?.id || user.addressId,
        };
        setUser(updatedUser);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      } catch (e) {
        console.warn('Backend address update failed, saving locally:', e);
        const updatedUser = {
          ...user,
          address: addressData,
        };
        setUser(updatedUser);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      }
    },
    [user, setUser]
  );

  const updatePreferredLanguages = useCallback(
    async (languages: string[]) => {
      if (!user) return;
      try {
        const res = await authService.updatePreferredLanguages(languages);
        setUser(res);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(res));
      } catch (e) {
        console.warn('Backend languages update failed, saving locally:', e);
        const updatedUser = {
          ...user,
          preferredLanguages: languages,
        };
        setUser(updatedUser);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      }
    },
    [user, setUser]
  );

  const upgradePlan = useCallback(
    async (planId: string, planName: string, price: string) => {
      if (!user) return;
      try {
        const res = await authService.upgradePlan(planId);
        setUser(res);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(res));
      } catch (e) {
        console.warn('Backend plan update failed, saving locally:', e);
        const updatedUser = {
          ...user,
          planId,
          plan: {
            id: planId,
            name: planName,
            price,
          },
        };
        setUser(updatedUser);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      }
    },
    [user, setUser]
  );

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    try {
      await authService.deleteAccount();
    } catch (e) {
      console.warn('Backend delete account failed:', e);
    }
    await logout();
  }, [user, logout]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        updateAddress,
        updatePreferredLanguages,
        upgradePlan,
        deleteAccount,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
