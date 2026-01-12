'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <AudioContext.Provider value={{
      currentTrack,
      isPlaying,
      setCurrentTrack,
      setIsPlaying,
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