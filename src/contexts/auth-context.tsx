import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { setApiAuthToken, setOnUnauthorizedCallback } from '@/services/api';
import {
  authService,
  normalizeUser,
  RegisterPayload,
  User,
} from '@/services/auth.service';
import { likesService } from '@/services/likes.service';

const AUTH_TOKEN_KEY = 'igcgmusic_auth_token';
const AUTH_USER_KEY = 'igcgmusic_auth_user';
const AUTH_LIKED_TRACKS_KEY = 'igcgmusic_liked_tracks';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  likedTracks: Set<string>;
  isLiked: (trackId: string) => boolean;
  toggleLike: (trackId: string) => Promise<boolean>;
  syncLikes: () => Promise<void>;
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
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  const setUser = useCallback((u: User | null) => {
    setUserState(normalizeUser(u));
  }, []);

  const clearSession = useCallback(async () => {
    setApiAuthToken(null);
    setToken(null);
    setUserState(null);
    setLikedTracks(new Set());
    try {
      await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        AUTH_USER_KEY,
        AUTH_LIKED_TRACKS_KEY,
      ]);
    } catch (e) {
      console.warn('Failed to clear auth storage:', e);
    }
  }, []);

  const syncLikes = useCallback(async () => {
    try {
      const tracks = await likesService.getLikes();
      const ids = new Set(tracks.map((t) => t.id).filter(Boolean));
      setLikedTracks(ids);
      await AsyncStorage.setItem(
        AUTH_LIKED_TRACKS_KEY,
        JSON.stringify(Array.from(ids))
      );
    } catch (e) {
      console.warn('Failed to sync likes from backend:', e);
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
        const [[, storedToken], [, storedUser], [, storedLikes]] =
          await AsyncStorage.multiGet([
            AUTH_TOKEN_KEY,
            AUTH_USER_KEY,
            AUTH_LIKED_TRACKS_KEY,
          ]);

        if (storedLikes && isMounted) {
          try {
            const parsed = JSON.parse(storedLikes);
            if (Array.isArray(parsed)) {
              setLikedTracks(new Set(parsed));
            }
          } catch {}
        }

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

          // Fetch fresh likes from server
          try {
            const tracks = await likesService.getLikes();
            if (isMounted) {
              const ids = new Set(tracks.map((t) => t.id).filter(Boolean));
              setLikedTracks(ids);
              await AsyncStorage.setItem(
                AUTH_LIKED_TRACKS_KEY,
                JSON.stringify(Array.from(ids))
              );
            }
          } catch (likeErr) {
            console.warn('Could not load likes on startup:', likeErr);
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

  const toggleLike = useCallback(
    async (trackId: string): Promise<boolean> => {
      if (!token || !user) {
        Alert.alert(
          'Conta necessária',
          'Faça login na sua conta para curtir e salvar seus hinos favoritos.'
        );
        return false;
      }

      const wasLiked = likedTracks.has(trackId);
      const nextSet = new Set(likedTracks);
      if (wasLiked) {
        nextSet.delete(trackId);
      } else {
        nextSet.add(trackId);
      }
      setLikedTracks(nextSet);

      try {
        await AsyncStorage.setItem(
          AUTH_LIKED_TRACKS_KEY,
          JSON.stringify(Array.from(nextSet))
        );
      } catch (err) {
        console.warn('Failed to cache liked tracks:', err);
      }

      try {
        if (wasLiked) {
          await likesService.unlike(trackId);
        } else {
          await likesService.like(trackId);
        }
        return true;
      } catch (err) {
        console.error('Failed to sync like action with backend:', err);
        // Rollback
        setLikedTracks((current) => {
          const rollbackSet = new Set(current);
          if (wasLiked) {
            rollbackSet.add(trackId);
          } else {
            rollbackSet.delete(trackId);
          }
          AsyncStorage.setItem(
            AUTH_LIKED_TRACKS_KEY,
            JSON.stringify(Array.from(rollbackSet))
          ).catch(() => {});
          return rollbackSet;
        });
        return false;
      }
    },
    [token, user, likedTracks]
  );

  const isLiked = useCallback(
    (trackId: string) => {
      return likedTracks.has(trackId);
    },
    [likedTracks]
  );

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

      // Sync likes immediately
      try {
        const tracks = await likesService.getLikes();
        const ids = new Set(tracks.map((t) => t.id).filter(Boolean));
        setLikedTracks(ids);
        await AsyncStorage.setItem(
          AUTH_LIKED_TRACKS_KEY,
          JSON.stringify(Array.from(ids))
        );
      } catch (e) {
        console.warn('Could not sync likes after login:', e);
      }

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
        likedTracks,
        isLiked,
        toggleLike,
        syncLikes,
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
