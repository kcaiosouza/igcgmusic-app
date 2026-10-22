import { api } from '@/services/api';
import { Track } from '@/types/player';
import { mapTrack } from '@/utils/track-mapper';

export interface PlaylistItem {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  coverUrl?: string | null;
  userId?: string;
  trackCount?: number;
  creator?:
    | {
        id: string;
        name?: string;
        username?: string;
      }
    | string;
}

export interface PlaylistDetails {
  id: string;
  name: string;
  isPublic: boolean;
  coverUrl?: string | null;
  createdAt: string;
  userId: string;
  creator?: {
    id: string;
    name?: string;
    username?: string;
  };
  isLiked?: boolean;
  tracks: Track[];
}

export const playlistService = {
  /**
   * Busca as playlists criadas pelo usuário (públicas e privadas).
   */
  async getUserPlaylists(userId: string): Promise<PlaylistItem[]> {
    const [publicRes, privateRes] = await Promise.all([
      api.get('/playlists', { params: { isPublic: true } }),
      api.get('/playlists', { params: { isPublic: false } }),
    ]);

    const publicList = Array.isArray(publicRes.data) ? publicRes.data : [];
    const privateList = Array.isArray(privateRes.data) ? privateRes.data : [];

    const userPlaylists: PlaylistItem[] = [
      ...publicList.filter((p: any) => p.userId === userId),
      ...privateList.filter((p: any) => p.userId === userId),
    ];

    userPlaylists.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return userPlaylists;
  },

  /**
   * Busca as playlists públicas que o usuário curtiu.
   */
  async getLikedPlaylists(): Promise<PlaylistItem[]> {
    const res = await api.get('/playlists/liked');
    const items = Array.isArray(res.data) ? res.data : [];
    return items;
  },

  /**
   * Cria uma nova playlist.
   */
  async createPlaylist(name: string, isPublic: boolean = true): Promise<PlaylistItem> {
    const res = await api.post('/playlists', { name, isPublic });
    return res.data;
  },

  /**
   * Busca os detalhes e faixas de uma playlist específica.
   */
  async getPlaylistDetails(playlistId: string): Promise<PlaylistDetails> {
    const res = await api.get(`/playlists/${playlistId}`);
    const data = res.data?.data || res.data;

    const rawTracks = Array.isArray(data?.tracks) ? data.tracks : [];
    const mappedTracks: Track[] = rawTracks
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((pt: any) => mapTrack(pt.track || pt))
      .filter((t: any): t is Track => !!t && !!t.id);

    return {
      id: data?.id || playlistId,
      name: data?.name || 'Playlist',
      isPublic: data?.isPublic ?? true,
      coverUrl: data?.coverUrl || null,
      createdAt: data?.createdAt || '',
      userId: data?.userId || '',
      creator: data?.creator || data?.user,
      isLiked: data?.isLiked,
      tracks: mappedTracks,
    };
  },

  /**
   * Atualiza nome ou privacidade da playlist.
   */
  async updatePlaylist(
    playlistId: string,
    payload: { name?: string; isPublic?: boolean }
  ): Promise<any> {
    return api.put(`/playlists/${playlistId}`, payload);
  },

  /**
   * Deleta uma playlist.
   */
  async deletePlaylist(playlistId: string): Promise<any> {
    return api.delete(`/playlists/${playlistId}`);
  },

  /**
   * Adiciona uma faixa à playlist.
   */
  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<any> {
    return api.post(`/playlists/${playlistId}/tracks`, { trackId });
  },

  /**
   * Remove uma faixa da playlist.
   */
  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<any> {
    return api.delete(`/playlists/${playlistId}/tracks/${trackId}`);
  },

  /**
   * Reordena as faixas da playlist no backend.
   */
  async reorderPlaylistTracks(playlistId: string, trackIds: string[]): Promise<any> {
    return api.put(`/playlists/${playlistId}/tracks/reorder`, { trackIds });
  },

  /**
   * Curte ou descurte uma playlist pública.
   */
  async likePlaylist(playlistId: string): Promise<any> {
    return api.post(`/playlists/${playlistId}/like`);
  },

  async unlikePlaylist(playlistId: string): Promise<any> {
    return api.delete(`/playlists/${playlistId}/like`);
  },
};

export default playlistService;
