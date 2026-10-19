export interface Track {
  id: string;
  title: string;
  thumbnail: string;
  members: string;
  duration: number;
  url: string;
  description?: string;
  lyrics?: string;
  chords?: string | null;
  tone?: string | null;
  intro?: string | null;
  albumId?: string;
  albumName?: string;
  playCount?: number;
  authorId?: string;
}

export interface PlayerContextType {
  trackList: Track[];
  currentTrackIndex: number;
  activeTrack: Track | null;
  hasActiveTrack: boolean;
  upcomingQueue: Track[];
  isPlaying: boolean;
  isBuffering: boolean;
  isLooping: boolean;
  isShuffling: boolean;
  currentTime: number;
  duration: number;
  progressPercent: number;

  play: (track: Track) => Promise<void>;
  playList: (tracks: Track[], startIndex?: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  toggleLoop: () => void;
  toggleShuffle: () => void;
  addToQueueNext: (track: Track) => void;
  addToQueueEnd: (track: Track) => void;
  enqueueTracks: (tracks: Track[]) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  removeFromQueue: (trackId: string) => void;
  playTrackFromQueue: (indexOrId: number | string) => Promise<void>;
  clearUpcomingQueue: () => void;
  clearQueue: () => void;

  isExpanded: boolean;
  openExpanded: () => void;
  closeExpanded: () => void;
}
