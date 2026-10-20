import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from '@/services/api';
import { Track } from '@/types/player';
import { mapTrack } from '@/utils/track-mapper';

const RECENT_SEARCHES_KEY = '@igcg:recent_searches';

export interface SearchAlbum {
  id: string;
  title: string;
  thumbnailUrl?: string;
  members?: string;
  authorName?: string;
}

export interface SearchArtist {
  id: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  members?: string;
  playCount?: number;
  trackCount?: number;
}

export interface SearchPlaylist {
  id: string;
  name: string;
  coverUrl?: string;
  trackCount?: number;
  user?: {
    username?: string;
    plan?: {
      name?: string;
    };
  };
}

export interface SearchResults {
  tracks: Track[];
  albums: SearchAlbum[];
  artists: SearchArtist[];
  playlists: SearchPlaylist[];
}

export interface ExploreCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  iconName: string;
}

export const DEFAULT_EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    id: 'cat-adoracao',
    name: 'Louvor & Adoração',
    slug: 'Adoração',
    color: '#04D361',
    iconName: 'Heart',
  },
  {
    id: 'cat-hinos',
    name: 'Hinos Tradicionais',
    slug: 'Hinos',
    color: '#3B82F6',
    iconName: 'BookOpen',
  },
  {
    id: 'cat-coral',
    name: 'Coral & Conjuntos',
    slug: 'Coral',
    color: '#8B5CF6',
    iconName: 'Users',
  },
  {
    id: 'cat-jovens',
    name: 'Jovens & Crianças',
    slug: 'Jovens',
    color: '#EC4899',
    iconName: 'Sparkles',
  },
  {
    id: 'cat-instrumental',
    name: 'Instrumental',
    slug: 'Instrumental',
    color: '#F59E0B',
    iconName: 'Music',
  },
  {
    id: 'cat-ceia',
    name: 'Ceia do Senhor',
    slug: 'Ceia',
    color: '#EF4444',
    iconName: 'Disc',
  },
  {
    id: 'cat-gratidao',
    name: 'Gratidão & Fé',
    slug: 'Gratidão',
    color: '#06B6D4',
    iconName: 'Smile',
  },
  {
    id: 'cat-oracao',
    name: 'Oração & Comunhão',
    slug: 'Oração',
    color: '#6366F1',
    iconName: 'Compass',
  },
];

/**
 * Executa a busca unificada na API com fallbacks idênticos à versão web.
 */
export async function searchContent(query: string): Promise<SearchResults> {
  const queryTrimmed = query.trim();
  if (queryTrimmed.length < 3) {
    return { tracks: [], albums: [], artists: [], playlists: [] };
  }

  try {
    // 1. Endpoint Unificado /search
    const response = await api.get('/search', {
      params: { q: queryTrimmed },
    });

    const data = response.data || {};
    const rawTracks = Array.isArray(data.tracks) ? data.tracks : [];
    const rawAlbums = Array.isArray(data.albums) ? data.albums : [];
    const rawArtists = Array.isArray(data.artists) ? data.artists : [];
    const rawPlaylists = Array.isArray(data.playlists) ? data.playlists : [];

    return {
      tracks: rawTracks.map(mapTrack),
      albums: rawAlbums,
      artists: rawArtists,
      playlists: rawPlaylists,
    };
  } catch (err) {
    console.warn('Falha na busca unificada (/search), tentando fallback /tracks:', err);

    // 2. Fallback para /tracks?search=...
    try {
      const fallbackResponse = await api.get('/tracks', {
        params: { search: queryTrimmed },
      });

      const fallbackTracks = Array.isArray(fallbackResponse.data)
        ? fallbackResponse.data
        : [];

      return {
        tracks: fallbackTracks.map(mapTrack),
        albums: [],
        artists: [],
        playlists: [],
      };
    } catch (fallbackErr) {
      console.warn('Falha no fallback de busca /tracks:', fallbackErr);
      return { tracks: [], albums: [], artists: [], playlists: [] };
    }
  }
}

/**
 * Busca o histórico de pesquisas recentes salvas no dispositivo.
 */
export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Salva um termo no histórico (até 10 itens únicos).
 */
export async function saveRecentSearch(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const current = await getRecentSearches();
    const filtered = current.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...filtered].slice(0, 10);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Remove um item individual do histórico.
 */
export async function removeRecentSearch(queryToRemove: string): Promise<string[]> {
  try {
    const current = await getRecentSearches();
    const updated = current.filter((item) => item !== queryToRemove);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Limpa todo o histórico de buscas.
 */
export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignora falha de remoção
  }
}
