import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  birthDate?: string;
  preferredLanguages?: string[];
  planId?: string;
  addressId?: string | null;
  createdAt?: string;
  customSpecialBadges?: string[];
  plan?: {
    id: string;
    name: string;
    price: string;
    createdAt?: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    number: string;
    complement?: string;
    neighborhood?: string;
  };
  [key: string]: any;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  username: string;
  password: string;
  birthDate: string;
  preferredLanguages?: string[];
}

export function normalizeUser(raw: any): User | null {
  if (!raw) return null;

  let badges: string[] = [];

  if (Array.isArray(raw.userBadges)) {
    badges = raw.userBadges
      .map((ub: any) => ub.badge?.key || ub.badgeKey || '')
      .filter(Boolean);
  } else if (Array.isArray(raw.badges)) {
    badges = raw.badges
      .map((b: any) => (typeof b === 'object' ? b.key || b.id || '' : String(b)))
      .filter(Boolean);
  } else if (Array.isArray(raw.customSpecialBadges)) {
    badges = raw.customSpecialBadges;
  }

  return {
    ...raw,
    customSpecialBadges: badges,
  };
}

export const authService = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const lowerIdentifier = identifier.trim().toLowerCase();
    const payload: Record<string, string> = {
      password,
      login: lowerIdentifier,
    };

    if (lowerIdentifier.includes('@') && !lowerIdentifier.startsWith('@')) {
      payload.email = lowerIdentifier;
    } else {
      const cleanUsername = lowerIdentifier.startsWith('@')
        ? lowerIdentifier.slice(1)
        : lowerIdentifier;
      payload.username = cleanUsername;
    }

    const res = await api.post<AuthResponse>('/auth/login', payload);
    return {
      token: res.data.token,
      user: normalizeUser(res.data.user) || res.data.user,
    };
  },

  async register(data: RegisterPayload): Promise<AuthResponse> {
    const cleanUsername = data.username.trim().replace(/^@/, '').toLowerCase();
    const payload: RegisterPayload = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      username: cleanUsername,
      password: data.password,
      birthDate: data.birthDate,
      preferredLanguages: data.preferredLanguages || ['pt'],
    };

    const res = await api.post<AuthResponse>('/auth/register', payload);
    return {
      token: res.data.token,
      user: normalizeUser(res.data.user) || res.data.user,
    };
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/auth/me');
    return normalizeUser(res.data) || res.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await api.post<{ message: string }>('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
    return res.data;
  },
};
