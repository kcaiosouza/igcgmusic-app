import { api } from '@/services/api';
import { Track } from '@/types/player';
import { mapTrack } from '@/utils/track-mapper';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface CuratedPlaylist {
  id: string;
  name: string;
  coverUrl?: string;
  trackCount?: number;
  tracks?: any[];
}

export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
  listeners?: number;
  trackCount?: number;
}

export interface HomeFeedData {
  categories: Category[];
  recentTracks: Track[];
  catalog: Track[];
  recentReleases: Track[];
  top10: Track[];
  curatedPlaylists: CuratedPlaylist[];
  popularDownloads: Track[];
  topArtists: Author[];
}

export async function fetchHomeFeed(): Promise<HomeFeedData> {
  const [
    homeRes,
    topRes,
    shuffleRes,
    playlistsRes,
    categoriesRes,
    downloadsRes,
    recentRes,
    authorsRes,
  ] = await Promise.allSettled([
    api.get<any[]>('/home', { params: { limit: 10 } }),
    api.get<any[]>('/tracks/top10'),
    api.get<any[]>('/tracks/shuffle'),
    api.get<any[]>('/playlists', { params: { isPublic: true } }),
    api.get<any[]>('/categories'),
    api.get<any[]>('/tracks/popular-downloads'),
    api.get<any[]>('/playback-history/recent', { params: { limit: 5 } }),
    api.get<any[]>('/authors', { params: { sortBy: 'listeners' } }),
  ]);

  const homeRaw = homeRes.status === 'fulfilled' && Array.isArray(homeRes.value.data) ? homeRes.value.data : [];
  const homeMapped = homeRaw.map(mapTrack);

  const topRaw = topRes.status === 'fulfilled' && Array.isArray(topRes.value.data) ? topRes.value.data : [];
  const top10 = topRaw.length > 0 ? topRaw.map(mapTrack) : homeMapped.slice(0, 10);

  const shuffleRaw = shuffleRes.status === 'fulfilled' && Array.isArray(shuffleRes.value.data) ? shuffleRes.value.data : [];
  const catalog = shuffleRaw.map(mapTrack);

  const playlistsRaw = playlistsRes.status === 'fulfilled' && Array.isArray(playlistsRes.value.data) ? playlistsRes.value.data : [];
  const curatedPlaylists: CuratedPlaylist[] = playlistsRaw.map((p: any) => ({
    id: p.id,
    name: p.name,
    coverUrl: p.coverUrl || p.coverPath,
    trackCount: p.trackCount || (Array.isArray(p.tracks) ? p.tracks.length : 0),
    tracks: p.tracks,
  }));

  const categoriesRaw = categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value.data) ? categoriesRes.value.data : [];
  const categories: Category[] = categoriesRaw.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug || c.id,
    icon: c.icon,
  }));

  const downloadsRaw = downloadsRes.status === 'fulfilled' && Array.isArray(downloadsRes.value.data) ? downloadsRes.value.data : [];
  const popularDownloads = downloadsRaw.map(mapTrack);

  const recentRaw = recentRes.status === 'fulfilled' && Array.isArray(recentRes.value.data) ? recentRes.value.data : [];
  const recentTracks = recentRaw.map(mapTrack);

  const authorsRaw = authorsRes.status === 'fulfilled' && Array.isArray(authorsRes.value.data) ? authorsRes.value.data : [];
  const topArtists: Author[] = authorsRaw.map((a: any) => ({
    id: a.id,
    name: a.name,
    avatarUrl: a.avatarUrl,
    listeners: a.listeners || a.playCount || 0,
    trackCount: a.trackCount,
  }));

  return {
    categories,
    recentTracks,
    catalog,
    recentReleases: homeMapped,
    top10,
    curatedPlaylists,
    popularDownloads,
    topArtists,
  };
}
