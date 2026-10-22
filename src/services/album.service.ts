import { api } from '@/services/api';
import { Track } from '@/types/player';
import { mapTrack } from '@/utils/track-mapper';

export interface AlbumDetails {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt?: string;
  authorId?: string;
  authorName?: string;
  tracks: Track[];
}

export const albumService = {
  async getAlbumById(id: string): Promise<AlbumDetails> {
    const rawId = id.trim();
    const res = await api.get<any>(`/albums/${encodeURIComponent(rawId)}`);
    const data = res.data;

    if (!data) {
      throw new Error('Álbum não encontrado');
    }

    const mappedTracks: Track[] = Array.isArray(data.tracks)
      ? data.tracks.map((t: any) => {
          const mapped = mapTrack(t);
          return {
            ...mapped,
            albumId: data.id ? String(data.id) : mapped.albumId,
            albumName: data.title || mapped.albumName,
            thumbnail:
              mapped.thumbnail ||
              data.thumbnailUrl ||
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
          };
        })
      : [];

    const authorName =
      data.authorName ||
      data.author?.name ||
      mappedTracks[0]?.members ||
      'Artista Desconhecido';

    const authorId =
      data.authorId ||
      data.author?.id ||
      mappedTracks[0]?.authorId ||
      undefined;

    return {
      id: String(data.id || rawId),
      title: data.title || 'Álbum',
      thumbnailUrl:
        data.thumbnailUrl ||
        mappedTracks[0]?.thumbnail ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
      publishedAt: data.publishedAt,
      authorId,
      authorName,
      tracks: mappedTracks,
    };
  },
};
