import { Track } from '@/types/player';

export function mapTrack(raw: any): Track {
  if (!raw) {
    return {
      id: '',
      title: '',
      thumbnail: '',
      members: '',
      duration: 0,
      url: '',
      description: '',
      lyrics: '',
    };
  }

  const id = raw.id || '';
  const rawTitle = raw.title || '';
  let title = rawTitle;
  let albumName =
    raw.albumName ||
    (raw.album && typeof raw.album === 'object'
      ? raw.album.name || raw.album.title
      : '') ||
    '';

  if (rawTitle.includes('|')) {
    const parts = rawTitle.split('|');
    albumName = parts[0].trim();
    title = parts[1].trim();
  }

  const description = raw.description || '';
  const lyrics = raw.lyrics || '';

  // Thumbnail
  let thumbnail = '';
  if (raw.thumbnailUrl) {
    thumbnail = raw.thumbnailUrl;
  } else if (raw.thumbnail) {
    thumbnail = raw.thumbnail;
  } else if (raw.coverUrl) {
    thumbnail = raw.coverUrl;
  }

  // Members / Artists
  let members = '';
  if (raw.members) {
    members = raw.members;
  } else if (Array.isArray(raw.authors)) {
    members = raw.authors
      .map((authorObj: any) => authorObj.author?.name || authorObj.name || '')
      .filter(Boolean)
      .join(', ');
  }

  // Audio URL
  let url = '';
  if (raw.audioUrl) {
    url = raw.audioUrl;
  } else if (raw.url) {
    url = raw.url;
  } else if (raw.file && typeof raw.file === 'object') {
    url = raw.file.url || '';
  }

  // Duration
  let duration = 0;
  if (typeof raw.duration === 'number') {
    duration = raw.duration;
  } else if (
    raw.file &&
    typeof raw.file === 'object' &&
    typeof raw.file.duration === 'number'
  ) {
    duration = raw.file.duration;
  }

  // PlayCount
  const playCount =
    typeof raw.playCount === 'number'
      ? raw.playCount
      : typeof raw.listeners === 'number'
        ? raw.listeners
        : undefined;

  // AuthorId
  let authorId = '';
  if (Array.isArray(raw.authors) && raw.authors.length > 0) {
    authorId = raw.authors[0]?.authorId || raw.authors[0]?.author?.id || '';
  } else if (raw.authorId) {
    authorId = raw.authorId;
  }

  return {
    id: String(id || url || title || Math.random().toString()),
    title,
    thumbnail,
    members: members || 'Artista Desconhecido',
    duration,
    url,
    description,
    lyrics,
    chords: raw.chords !== undefined ? raw.chords || null : undefined,
    tone: raw.tone !== undefined ? raw.tone || null : undefined,
    intro: raw.intro !== undefined ? raw.intro || null : undefined,
    albumId: raw.albumId || '',
    albumName: albumName || 'IGCG Music',
    playCount,
    authorId,
  };
}
