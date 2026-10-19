import Constants, { AppOwnership, ExecutionEnvironment } from 'expo-constants';
import {
  AudioPlayer,
  AudioSource,
  AudioStatus,
  clearAllPreloadedSources,
  createAudioPlayer,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { api } from '@/services/api';
import { PlayerContextType, Track } from '@/types/player';

function formatAudioUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  try {
    return encodeURI(decodeURI(trimmed));
  } catch {
    return trimmed;
  }
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [trackList, setTrackList] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const playerRef = useRef<AudioPlayer | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const isLockScreenActiveRef = useRef(false);
  const lockScreenFailedRef = useRef(false);

  const isLoopingRef = useRef(isLooping);
  const isShufflingRef = useRef(isShuffling);
  const trackListRef = useRef(trackList);
  const currentIndexRef = useRef(currentTrackIndex);
  const activeTrackRef = useRef(activeTrack);
  const onTrackFinishedRef = useRef<() => void>(() => {});

  // Controle de requisições de ouvintes e histórico (evita chamadas duplicadas na mesma reprodução)
  const recentlyListenedRef = useRef<Set<string>>(new Set());
  const playbackHistoryLoggedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    isLoopingRef.current = isLooping;
    isShufflingRef.current = isShuffling;
    trackListRef.current = trackList;
    currentIndexRef.current = currentTrackIndex;
    activeTrackRef.current = activeTrack;
  }, [isLooping, isShuffling, trackList, currentTrackIndex, activeTrack]);

  const activeTrackId = activeTrack?.id;
  const activeTrackLyrics = activeTrack?.lyrics;
  const activeTrackChords = activeTrack?.chords;

  // Carrega os detalhes completos do hino (letra, cifras, tom, intro) caso faltem na faixa atual
  useEffect(() => {
    if (
      activeTrackId &&
      (!activeTrackLyrics || activeTrackChords === undefined)
    ) {
      api
        .get<any>(`/tracks/${activeTrackId}`)
        .then((res) => {
          if (res.data) {
            const { lyrics, chords, tone, intro } = res.data;

            setActiveTrack((prev) => {
              if (!prev || prev.id !== activeTrackId) return prev;
              return {
                ...prev,
                lyrics: lyrics || prev.lyrics,
                chords: chords !== undefined ? chords : prev.chords,
                tone: tone !== undefined ? tone : prev.tone,
                intro: intro !== undefined ? intro : prev.intro,
              };
            });

            setTrackList((prevList) =>
              prevList.map((t) =>
                t.id === activeTrackId
                  ? {
                      ...t,
                      lyrics: lyrics || t.lyrics,
                      chords: chords !== undefined ? chords : t.chords,
                      tone: tone !== undefined ? tone : t.tone,
                      intro: intro !== undefined ? intro : t.intro,
                    }
                  : t
              )
            );
          }
        })
        .catch((err) => {
          console.warn(`Falha ao buscar detalhes do hino ${activeTrackId}:`, err);
        });
    }
  }, [activeTrackId, activeTrackLyrics, activeTrackChords]);

  const attachPlayerListeners = useCallback((player: AudioPlayer) => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.remove();
      } catch {}
      subscriptionRef.current = null;
    }

    subscriptionRef.current = player.addListener(
      'playbackStatusUpdate',
      (status: AudioStatus) => {
        setIsPlaying(status.playing);
        setIsBuffering(status.isBuffering);
        setCurrentTime(status.currentTime || 0);

        if (status.duration && status.duration > 0) {
          setDuration(status.duration);
        }

        // Regra da Web: Incrementar ouvintes após 5s de reprodução contínua
        const currentTrack = activeTrackRef.current;
        if (currentTrack?.id && status.currentTime >= 5) {
          if (!recentlyListenedRef.current.has(currentTrack.id)) {
            recentlyListenedRef.current.add(currentTrack.id);
            api.post(`/tracks/${currentTrack.id}/listen`).catch((err) => {
              console.warn(
                `Falha ao registrar incremento de ouvintes para ${currentTrack.id}:`,
                err
              );
            });
          }
        }

        // Regra da Web: Registrar histórico de reprodução após 25% da faixa (máximo 60s) ou 10s
        const trackDuration = status.duration || currentTrack?.duration || 0;
        const historyThreshold =
          trackDuration > 0 ? Math.min(trackDuration * 0.25, 60) : 10;
        if (currentTrack?.id && status.currentTime >= historyThreshold) {
          if (!playbackHistoryLoggedRef.current.has(currentTrack.id)) {
            playbackHistoryLoggedRef.current.add(currentTrack.id);
            api
              .post('/playback-history', {
                trackId: currentTrack.id,
                durationPlayed: Math.floor(trackDuration || 120),
              })
              .catch((err) => {
                console.warn(
                  `Falha ao registrar histórico de reprodução para ${currentTrack.id}:`,
                  err
                );
              });
          }
        }

        if (status.didJustFinish) {
          // Desacopla o término síncrono do evento nativo para evitar HostFunction exception
          setTimeout(() => {
            onTrackFinishedRef.current?.();
          }, 100);
        }
      }
    );
  }, []);

  const createAndInitPlayer = useCallback(
    (initialSource?: AudioSource) => {
      if (playerRef.current) {
        try {
          playerRef.current.remove();
        } catch {}
        playerRef.current = null;
      }
      isLockScreenActiveRef.current = false;

      const player = createAudioPlayer(initialSource || null, {
        updateInterval: 250,
        keepAudioSessionActive: true,
      });
      player.loop = isLoopingRef.current;
      playerRef.current = player;
      attachPlayerListeners(player);
      return player;
    },
    [attachPlayerListeners]
  );

  // Inicializa o player e configura o modo de áudio nativo para execução em segundo plano
  useEffect(() => {
    try {
      clearAllPreloadedSources();
    } catch {}

    if (Platform.OS === 'android') {
      requestNotificationPermissionsAsync().catch(() => {});
    }

    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((err) => {
      console.warn('Erro ao configurar audio mode global:', err);
    });

    createAndInitPlayer(null);

    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.remove();
        } catch {}
        subscriptionRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.remove();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [createAndInitPlayer]);

  const updateLockScreen = useCallback((track: Track) => {
    const player = playerRef.current;
    if (!player) return;

    // No Expo Go para Android, o AudioControlsService não existe no manifest pré-compilado do Expo Go.
    // Chamar setActiveForLockScreen geraria "service binding failed".
    const isExpoGo =
      Constants.appOwnership === AppOwnership.Expo ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

    if (Platform.OS === 'android' && isExpoGo) {
      return;
    }

    if (lockScreenFailedRef.current) {
      return;
    }

    const metadata = {
      title: track.title,
      artist: track.members || 'IGCG Music',
      albumTitle: track.albumName || 'IGCG Music',
      artworkUrl: track.thumbnail,
    };

    try {
      if (isLockScreenActiveRef.current) {
        player.updateLockScreenMetadata(metadata);
      } else {
        player.setActiveForLockScreen(true, metadata, {
          showSeekForward: true,
          showSeekBackward: true,
        });
        isLockScreenActiveRef.current = true;
      }
    } catch (e) {
      lockScreenFailedRef.current = true;
      console.warn('Falha ao configurar controles na tela de bloqueio:', e);
    }
  }, []);

  const playTrackAtIndex = useCallback(
    async (list: Track[], index: number) => {
      if (!list[index]) return;
      const track = list[index];

      setTrackList(list);
      setCurrentTrackIndex(index);
      setActiveTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || 0);

      if (!track.url) {
        console.warn('URL do áudio não informada para:', track.title);
        return;
      }

      const formattedUrl = formatAudioUrl(track.url);
      if (!formattedUrl) {
        console.warn('URL do áudio inválida:', track.url);
        return;
      }

      let player = playerRef.current;
      if (!player) {
        player = createAndInitPlayer({ uri: formattedUrl });
        updateLockScreen(track);
        player.play();
        return;
      }

      try {
        try {
          player.pause();
        } catch {}

        try {
          player.replace({ uri: formattedUrl });
        } catch (replaceErr) {
          console.warn(
            'Falha no player.replace, recriando player com a nova faixa:',
            replaceErr
          );
          player = createAndInitPlayer({ uri: formattedUrl });
        }

        updateLockScreen(track);
        player.play();
      } catch (err) {
        console.error('Erro ao reproduzir faixa:', err);
      }
    },
    [createAndInitPlayer, updateLockScreen]
  );

  const handlePlayNext = useCallback(async () => {
    const list = trackListRef.current;
    const currentIdx = currentIndexRef.current;
    if (!list.length) return;

    if (isShufflingRef.current && list.length > 1) {
      let nextIdx = Math.floor(Math.random() * list.length);
      while (nextIdx === currentIdx && list.length > 1) {
        nextIdx = Math.floor(Math.random() * list.length);
      }
      await playTrackAtIndex(list, nextIdx);
    } else if (currentIdx + 1 < list.length) {
      await playTrackAtIndex(list, currentIdx + 1);
    } else {
      setIsPlaying(false);
    }
  }, [playTrackAtIndex]);

  // Atualiza o callback de término de faixa
  useEffect(() => {
    onTrackFinishedRef.current = () => {
      if (isLoopingRef.current) {
        playerRef.current?.seekTo(0).then(() => playerRef.current?.play());
      } else {
        handlePlayNext();
      }
    };
  }, [handlePlayNext]);

  const play = useCallback(
    async (track: Track) => {
      const existingIdx = trackList.findIndex((t) => t.id === track.id);
      if (existingIdx !== -1) {
        await playTrackAtIndex(trackList, existingIdx);
      } else {
        const newList = [track, ...trackList];
        await playTrackAtIndex(newList, 0);
      }
    },
    [trackList, playTrackAtIndex]
  );

  const playList = useCallback(
    async (tracks: Track[], startIndex = 0) => {
      if (!tracks.length) return;
      await playTrackAtIndex(tracks, startIndex);
    },
    [playTrackAtIndex]
  );

  const togglePlay = useCallback(async () => {
    const player = playerRef.current;
    if (!player || !activeTrack) return;

    if (isPlaying) {
      player.pause();
    } else {
      updateLockScreen(activeTrack);
      player.play();
    }
  }, [isPlaying, activeTrack, updateLockScreen]);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    if (activeTrack) {
      updateLockScreen(activeTrack);
    }
    playerRef.current?.play();
  }, [activeTrack, updateLockScreen]);

  const playNext = useCallback(async () => {
    await handlePlayNext();
  }, [handlePlayNext]);

  const playPrevious = useCallback(async () => {
    const list = trackListRef.current;
    const currentIdx = currentIndexRef.current;
    if (!list.length) return;

    if (currentTime > 3) {
      await playerRef.current?.seekTo(0);
      return;
    }

    if (currentIdx > 0) {
      await playTrackAtIndex(list, currentIdx - 1);
    } else {
      await playerRef.current?.seekTo(0);
    }
  }, [currentTime, playTrackAtIndex]);

  const seekTo = useCallback(async (seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    setCurrentTime(seconds);
    await player.seekTo(seconds);
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      const next = !prev;
      if (playerRef.current) {
        playerRef.current.loop = next;
      }
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffling((prev) => !prev);
  }, []);

  const addToQueueNext = useCallback((track: Track) => {
    setTrackList((prev) => {
      const currentIdx = currentIndexRef.current;
      const nextList = [...prev];
      nextList.splice(currentIdx + 1, 0, track);
      return nextList;
    });
  }, []);

  const addToQueueEnd = useCallback((track: Track) => {
    setTrackList((prev) => [...prev, track]);
  }, []);

  const enqueueTracks = useCallback(
    (tracks: Track[]) => {
      if (!tracks.length) return;
      setTrackList((prev) => {
        if (!prev.length || currentIndexRef.current === -1) {
          playTrackAtIndex(tracks, 0);
          return tracks;
        }
        return [...prev, ...tracks];
      });
    },
    [playTrackAtIndex]
  );

  const moveQueueItem = useCallback((fromIndex: number, toIndex: number) => {
    setTrackList((prev) => {
      const currentIdx = currentIndexRef.current;
      const realFrom = currentIdx + 1 + fromIndex;
      const realTo = currentIdx + 1 + toIndex;
      if (
        realFrom < currentIdx + 1 ||
        realFrom >= prev.length ||
        realTo < currentIdx + 1 ||
        realTo >= prev.length
      ) {
        return prev;
      }
      const nextList = [...prev];
      const [moved] = nextList.splice(realFrom, 1);
      nextList.splice(realTo, 0, moved);
      return nextList;
    });
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setTrackList((prev) => {
      const idx = prev.findIndex((t) => t.id === trackId);
      if (idx === -1) return prev;
      const nextList = [...prev];
      nextList.splice(idx, 1);
      if (idx < currentIndexRef.current) {
        setCurrentTrackIndex((c) => Math.max(0, c - 1));
      }
      return nextList;
    });
  }, []);

  const playTrackFromQueue = useCallback(
    async (indexOrId: number | string) => {
      const list = trackListRef.current;
      let targetIndex = -1;
      if (typeof indexOrId === 'number') {
        targetIndex = indexOrId;
      } else {
        targetIndex = list.findIndex((t) => t.id === indexOrId);
      }
      if (targetIndex >= 0 && targetIndex < list.length) {
        await playTrackAtIndex(list, targetIndex);
      }
    },
    [playTrackAtIndex]
  );

  const clearUpcomingQueue = useCallback(() => {
    setTrackList((prev) => {
      const currentIdx = currentIndexRef.current;
      return prev.slice(0, currentIdx + 1);
    });
  }, []);

  const clearQueue = useCallback(() => {
    setTrackList([]);
    setCurrentTrackIndex(-1);
    setActiveTrack(null);
    playerRef.current?.pause();
    if (isLockScreenActiveRef.current) {
      try {
        playerRef.current?.setActiveForLockScreen(false);
      } catch {}
      isLockScreenActiveRef.current = false;
    }
  }, []);

  const openExpanded = useCallback(() => setIsExpanded(true), []);
  const closeExpanded = useCallback(() => setIsExpanded(false), []);

  const progressPercent = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  const upcomingQueue = useMemo(() => {
    if (currentTrackIndex < 0 || currentTrackIndex >= trackList.length) {
      return [];
    }
    return trackList.slice(currentTrackIndex + 1);
  }, [trackList, currentTrackIndex]);

  const value: PlayerContextType = {
    trackList,
    currentTrackIndex,
    activeTrack,
    hasActiveTrack: activeTrack !== null,
    upcomingQueue,
    isPlaying,
    isBuffering,
    isLooping,
    isShuffling,
    currentTime,
    duration,
    progressPercent,
    play,
    playList,
    togglePlay,
    pause,
    resume,
    playNext,
    playPrevious,
    seekTo,
    toggleLoop,
    toggleShuffle,
    addToQueueNext,
    addToQueueEnd,
    enqueueTracks,
    moveQueueItem,
    removeFromQueue,
    playTrackFromQueue,
    clearUpcomingQueue,
    clearQueue,
    isExpanded,
    openExpanded,
    closeExpanded,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer deve ser usado dentro de um PlayerProvider');
  }
  return context;
}
