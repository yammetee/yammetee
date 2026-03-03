'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PlayableTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audio: string;
  lyrics?: string;
}

interface AudioContextType {
  currentTrack: PlayableTrack | null;
  queue: PlayableTrack[];
  currentIndex: number;
  isPlaying: boolean;
  setCurrentTrack: (track: PlayableTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setQueueAndPlay: (tracks: PlayableTrack[], startIndex?: number) => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;
  clearPlayback: () => void;
  togglePlayPause: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  const [queue, setQueue] = useState<PlayableTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const setQueueAndPlay = (tracks: PlayableTrack[], startIndex = 0) => {
    if (!tracks.length) return;
    const safeIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    setQueue(tracks);
    setCurrentIndex(safeIndex);
    setCurrentTrack(tracks[safeIndex]);
    setIsPlaying(true);
  };

  const playNextTrack = () => {
    if (currentIndex < 0 || currentIndex >= queue.length - 1) {
      setIsPlaying(false);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevTrack = () => {
    if (currentIndex <= 0 || currentIndex >= queue.length) {
      return;
    }

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
    setIsPlaying(true);
  };

  const clearPlayback = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
    setQueue([]);
    setCurrentIndex(-1);
  };

  return (
    <AudioContext.Provider value={{
      currentTrack,
      queue,
      currentIndex,
      isPlaying,
      setCurrentTrack,
      setIsPlaying,
      setQueueAndPlay,
      playNextTrack,
      playPrevTrack,
      clearPlayback,
      togglePlayPause,
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
