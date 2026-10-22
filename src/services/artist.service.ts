import { api } from '@/services/api';
import { Track } from '@/types/player';
import { mapTrack } from '@/utils/track-mapper';

export interface ArtistAlbum {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt?: string;
  tracks: Track[];
}

export interface ArtistDetails {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
  playCount: number;
  albums: ArtistAlbum[];
  allTracks: Track[];
}

export function resolveArtistMetadata(
  name: string,
  backendAvatar?: string,
  backendBio?: string
): { avatar: string; bio: string } {
  const normalized = (name || '').toLowerCase();
  let avatar = backendAvatar || '';
  let bio = backendBio || '';

  if (!avatar) {
    if (normalized.includes('288')) {
      avatar = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300';
    } else if (normalized.includes('arvore') || normalized.includes('árvore')) {
      avatar = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300';
    } else if (normalized.includes('antonio') || normalized.includes('antônio')) {
      avatar = 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300';
    } else if (normalized.includes('zoe')) {
      avatar = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300';
    } else {
      avatar = 'https://igcgcloud.netlify.app/images/default.png';
    }
  }

  if (!bio) {
    if (normalized.includes('288')) {
      bio =
        'Ministério de louvor e adoração dedicado a espalhar a verdade e o amor por meio da música cristã contemporânea.';
    } else if (normalized.includes('arvore') || normalized.includes('árvore')) {
      bio =
        'Editora Árvore da Vida, produzindo hinos espirituais edificantes e literatura cristã para comunhão.';
    } else if (normalized.includes('antonio') || normalized.includes('antônio')) {
      bio = 'Coletânea de faixas e áudios de Antônio.';
    } else if (normalized.includes('zoe')) {
      bio = 'Coletânea de faixas e áudios do Ministério Zoe.';
    } else {
      bio =
        'As informações deste artista estão disponíveis no IGCGMusic. Explore suas músicas, álbuns e lançamentos.';
    }
  }

  return { avatar, bio };
}

export const artistService = {
  async getArtistById(idOrSlug: string): Promise<ArtistDetails> {
    const rawId = idOrSlug.trim();
    const fallbackName = decodeURIComponent(rawId).replace(/-/g, ' ');

    const res = await api.get<any>(`/authors/${encodeURIComponent(rawId)}`);
    const data = res.data;

    if (!data) {
      throw new Error('Artista não encontrado');
    }

    const name = data.name || fallbackName;
    const { avatar, bio } = resolveArtistMetadata(
      name,
      data.avatarUrl || data.avatar || '',
      data.bio || ''
    );

    const albums: ArtistAlbum[] = [];
    const allTracks: Track[] = [];

    // Mapeamento dos álbuns oficiais
    if (Array.isArray(data.albums)) {
      for (const album of data.albums) {
        const mappedTracks: Track[] = (album.tracks || []).map((t: any) => {
          const mapped = mapTrack(t);
          return {
            ...mapped,
            thumbnail:
              mapped.thumbnail ||
              album.thumbnailUrl ||
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
            albumId: album.id ? String(album.id) : undefined,
            albumName: album.title || mapped.albumName,
          };
        });

        albums.push({
          id: album.id ? String(album.id) : `album-${albums.length}`,
          title: album.title || 'Álbum',
          thumbnailUrl:
            album.thumbnailUrl ||
            (mappedTracks[0]?.thumbnail ??
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'),
          publishedAt: album.publishedAt,
          tracks: mappedTracks,
        });

        allTracks.push(...mappedTracks);
      }
    }

    // Mapeamento dos singles/faixas avulsas em um grupo 'no-album'
    if (Array.isArray(data.singles) && data.singles.length > 0) {
      const mappedSingles: Track[] = data.singles.map((t: any) => {
        const mapped = mapTrack(t);
        return {
          ...mapped,
          thumbnail:
            mapped.thumbnail ||
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
          albumId: 'no-album',
          albumName: 'Outros Hinos / Áudios',
        };
      });

      albums.push({
        id: 'no-album',
        title: 'Outros Hinos / Áudios',
        thumbnailUrl:
          mappedSingles[0]?.thumbnail ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
        tracks: mappedSingles,
      });

      allTracks.push(...mappedSingles);
    }

    return {
      id: data.id || rawId,
      name,
      avatarUrl: avatar,
      bio,
      playCount: typeof data.playCount === 'number' ? data.playCount : 0,
      albums,
      allTracks,
    };
  },
};
