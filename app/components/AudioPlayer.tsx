'use client';

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Repeat, Volume2, X, SkipBack, SkipForward } from "lucide-react";
import Image from "next/image";
import { useAudio } from "../contexts/AudioContext";
import { useLanguage } from "../contexts/LanguageContext";

interface WaveSurferInstance {
  destroy: () => void;
  load: (src: string) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  play: () => void;
  pause: () => void;
  seekTo: (progress: number) => void;
  setVolume: (value: number) => void;
}

export default function AudioPlayer() {
  const { t } = useLanguage();
  const {
    currentTrack,
    isPlaying,
    queue,
    currentIndex,
    setIsPlaying,
    playNextTrack,
    playPrevTrack,
    clearPlayback,
  } = useAudio();
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<WaveSurferInstance | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const isLoopingRef = useRef(false);
  const creatingTrackIdRef = useRef<string | null>(null);
  const volumeRef = useRef(0.3);
  const isPlayingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastRenderedSecondRef = useRef(-1);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!currentTrack) {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
      if (waveformRef.current) {
        waveformRef.current.innerHTML = '';
      }
      creatingTrackIdRef.current = null;
      lastRenderedSecondRef.current = -1;
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (currentTrack && waveformRef.current) {
      if (creatingTrackIdRef.current === currentTrack.id) return; // already creating for this track

      creatingTrackIdRef.current = currentTrack.id;
      lastRenderedSecondRef.current = -1;
      setCurrentTime(0);
      setDuration(0);

      // Destroy existing instance
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }

      // Clear the container
      if (waveformRef.current) {
        waveformRef.current.innerHTML = '';
      }

      import('wavesurfer.js').then((WaveSurferModule) => {
        if (creatingTrackIdRef.current !== currentTrack.id) return; // cancelled

        const WaveSurfer = WaveSurferModule.default;

        wavesurfer.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: "#2f2f2f",
          progressColor: "#ffffff",
          barWidth: 2,
          barGap: 1,
          height: 34,
          cursorWidth: 0,
          responsive: true,
          backend: "MediaElement",
        });

        wavesurfer.current.load(currentTrack.audio);

        wavesurfer.current.on("ready", () => {
          if (!mountedRef.current || !wavesurfer.current) return;
          setDuration(Math.floor(wavesurfer.current.getDuration()));
          if (isPlayingRef.current) {
            wavesurfer.current.play();
          }
        });

        wavesurfer.current.on("audioprocess", () => {
          if (!mountedRef.current || !wavesurfer.current) return;
          const nextSecond = Math.floor(wavesurfer.current.getCurrentTime());
          if (nextSecond !== lastRenderedSecondRef.current) {
            lastRenderedSecondRef.current = nextSecond;
            setCurrentTime(nextSecond);
          }
        });

        wavesurfer.current.on("play", () => setIsPlaying(true));
        wavesurfer.current.on("pause", () => setIsPlaying(false));

        wavesurfer.current.on("error", (error) => {
          console.error('WaveSurfer error:', error);
        });

        wavesurfer.current.on('finish', () => {
          if (isLoopingRef.current) {
            if (!wavesurfer.current) return;
            wavesurfer.current.seekTo(0);
            wavesurfer.current.play();
          } else {
            playNextTrack();
          }
        });

        // Set initial volume
        wavesurfer.current.setVolume(volumeRef.current);
      });
    }
  }, [currentTrack, setIsPlaying, playNextTrack]);

  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [setIsPlaying]);

  useEffect(() => {
    if (wavesurfer.current) {
      if (isPlaying) {
        wavesurfer.current.play();
      } else {
        wavesurfer.current.pause();
      }
    }
  }, [isPlaying]);

  const toggleLoop = () => {
    const newLooping = !isLooping;
    setIsLooping(newLooping);
    isLoopingRef.current = newLooping;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(newVolume);
    }
  };

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const handlePrev = () => {
    if (wavesurfer.current && wavesurfer.current.getCurrentTime() > 3) {
      wavesurfer.current.seekTo(0);
      return;
    }
    playPrevTrack();
  };
  const closePlayer = () => {
    clearPlayback();
    setCurrentTime(0);
    setDuration(0);
  };

  if (!currentTrack) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-black text-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-50"
    >
      <div className="max-w-7xl mx-auto">
        <div ref={waveformRef} className="mb-2" />

        <div className="flex justify-between text-[11px] text-gray-400 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="basis-2/5 min-w-0 flex items-center gap-2">
            <Image src={currentTrack.cover} alt={`${currentTrack.title} cover`} width={40} height={40} className="w-10 h-10 object-cover shrink-0" />
            <div className="min-w-0">
              <div className="marquee-wrap overflow-hidden whitespace-nowrap text-sm font-semibold leading-tight">
                <div className="marquee-track">
                  <span className="pr-8">{currentTrack.title}</span>
                  <span className="pr-8" aria-hidden>{currentTrack.title}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="basis-3/5 min-w-0 flex items-center justify-end gap-0.5">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className="text-gray-400 hover:text-white p-2 disabled:opacity-40 disabled:cursor-not-allowed"
              title={t.player.previous}
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (wavesurfer.current) {
                  if (isPlaying) {
                    wavesurfer.current.pause();
                  } else {
                    wavesurfer.current.play();
                  }
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
              className="bg-white text-black p-2 rounded-full"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={playNextTrack}
              disabled={!hasNext}
              className="text-gray-400 hover:text-white p-2 disabled:opacity-40 disabled:cursor-not-allowed"
              title={t.player.next}
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={toggleLoop}
              className={`p-2 ${isLooping ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
              title={t.player.loop}
            >
              <Repeat className="w-4 h-4" />
            </button>
            <button
              onClick={closePlayer}
              className="text-gray-400 hover:text-white p-2"
              title={t.player.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 w-full">
          <button className="text-gray-400 hover:text-white p-1.5 shrink-0" title={t.player.volume}>
            <Volume2 className="w-4 h-4" />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
      <style jsx>{`
        .marquee-track {
          display: inline-flex;
          min-width: 100%;
          animation: marquee 10s linear infinite;
        }

        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
