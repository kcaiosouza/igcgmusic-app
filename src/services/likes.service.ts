import { api } from '@/services/api';
import { Track } from '@/types/player';
import { mapTrack } from '@/utils/track-mapper';

export const likesService = {
  /**
   * Busca todas as faixas curtidas pelo usuário autenticado.
   */
  async getLikes(): Promise<Track[]> {
    const res = await api.get('/likes');
    const items = Array.isArray(res.data) ? res.data : [];

    return items
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((item: any) => {
        if (!item || typeof item !== 'object') return null;
        if (item.track && typeof item.track === 'object') {
          return mapTrack(item.track);
        }
        return mapTrack(item);
      })
      .filter((t): t is Track => t !== null && !!t.id);
  },

  /**
   * Curte uma faixa (adiciona aos favoritos).
   */
  async like(trackId: string): Promise<any> {
    return api.post('/likes', { trackId });
  },

  /**
   * Descurte uma faixa (remove dos favoritos).
   */
  async unlike(trackId: string): Promise<any> {
    return api.delete(`/likes/${trackId}`);
  },

  /**
   * Atualiza a ordenação das faixas favoritas no backend.
   */
  async reorder(trackIds: string[]): Promise<any> {
    return api.put('/likes/reorder', { trackIds });
  },
};

export default likesService;
