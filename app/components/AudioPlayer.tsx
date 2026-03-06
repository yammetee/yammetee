'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Repeat, Shuffle, Volume2, X, SkipBack, SkipForward } from "lucide-react";
import Image from "next/image";
import { useAudio } from "../contexts/AudioContext";
import { useLanguage } from "../contexts/LanguageContext";
import { resolveAudioSource, resolveTrackAssetSource } from "../lib/audio-source";
import { preloadAudio } from "../lib/audio-preload";
import { logClientError } from "../lib/client-log";

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

type RepeatMode = "off" | "all" | "one";

export default function AudioPlayer() {
  const DESKTOP_MIN_WIDTH = 768;
  const DESKTOP_PANEL_WIDTH = 560;
  const DESKTOP_PANEL_HEIGHT = 210;
  const DESKTOP_PADDING = 16;
  const DESKTOP_TOP_OFFSET = 80;

  const { t } = useLanguage();
  const {
    currentTrack,
    isPlaying,
    queue,
    currentIndex,
    setIsPlaying,
    setQueueAndPlay,
    playNextTrack,
    playPrevTrack,
    clearPlayback,
  } = useAudio();
  const currentTrackId = currentTrack?.id ?? null;
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<WaveSurferInstance | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [volume, setVolume] = useState(0.3);
  const isShuffleEnabledRef = useRef(false);
  const repeatModeRef = useRef<RepeatMode>("off");
  const shuffleHistoryRef = useRef<number[]>([]);
  const playRandomTrackRef = useRef<() => void>(() => {});
  const creatingTrackIdRef = useRef<string | null>(null);
  const volumeRef = useRef(0.3);
  const isPlayingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastRenderedSecondRef = useRef(-1);
  const playTrackedTrackIdRef = useRef<string | null>(null);
  const playTrackRequestInFlightRef = useRef(false);
  const desktopPanelRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const desktopPositionInitializedRef = useRef(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches;
  });
  const [desktopPosition, setDesktopPosition] = useState({ x: 24, y: 88 });

  const clampDesktopPosition = useCallback((x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const panelRect = desktopPanelRef.current?.getBoundingClientRect();
    const panelWidth = panelRect?.width || DESKTOP_PANEL_WIDTH;
    const panelHeight = panelRect?.height || DESKTOP_PANEL_HEIGHT;
    const maxX = Math.max(DESKTOP_PADDING, window.innerWidth - panelWidth - DESKTOP_PADDING);
    const maxY = Math.max(DESKTOP_TOP_OFFSET, window.innerHeight - panelHeight - DESKTOP_PADDING);
    return {
      x: Math.min(Math.max(x, DESKTOP_PADDING), maxX),
      y: Math.min(Math.max(y, DESKTOP_TOP_OFFSET), maxY),
    };
  }, []);

  const placeDesktopPlayerRandomly = useCallback(() => {
    if (typeof window === "undefined") return;
    const panelRect = desktopPanelRef.current?.getBoundingClientRect();
    const panelWidth = panelRect?.width || DESKTOP_PANEL_WIDTH;
    const panelHeight = panelRect?.height || DESKTOP_PANEL_HEIGHT;

    const minX = DESKTOP_PADDING;
    const maxX = Math.max(minX, window.innerWidth - panelWidth - DESKTOP_PADDING);
    const minY = DESKTOP_TOP_OFFSET;
    const maxY = Math.max(minY, window.innerHeight - panelHeight - DESKTOP_PADDING);

    const x = minX + Math.random() * Math.max(0, maxX - minX);
    const y = minY + Math.random() * Math.max(0, maxY - minY);
    setDesktopPosition({ x: Math.round(x), y: Math.round(y) });
  }, []);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
    const applyDesktopState = () => setIsDesktop(mediaQuery.matches);
    applyDesktopState();
    mediaQuery.addEventListener("change", applyDesktopState);
    return () => {
      mediaQuery.removeEventListener("change", applyDesktopState);
    };
  }, []);

  useEffect(() => {
    if (!currentTrackId || !isDesktop || desktopPositionInitializedRef.current) return;
    placeDesktopPlayerRandomly();
    desktopPositionInitializedRef.current = true;
  }, [currentTrackId, isDesktop, placeDesktopPlayerRandomly]);

  useEffect(() => {
    if (!isDesktop) return;
    const onResize = () => {
      setDesktopPosition((position) => clampDesktopPosition(position.x, position.y));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [isDesktop, clampDesktopPosition]);

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
    isShuffleEnabledRef.current = isShuffleEnabled;
  }, [isShuffleEnabled]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

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
      shuffleHistoryRef.current = [];
      playTrackedTrackIdRef.current = null;
      playTrackRequestInFlightRef.current = false;
      desktopPositionInitializedRef.current = false;
    }
  }, [currentTrack]);

  const trackPlayIfEligible = useCallback(async (playedSeconds: number, durationSeconds: number) => {
    if (!currentTrack) return;
    if (playTrackRequestInFlightRef.current) return;
    if (playTrackedTrackIdRef.current === currentTrack.id) return;

    const threshold = durationSeconds > 0
      ? Math.max(10, Math.min(30, Math.floor(durationSeconds * 0.5)))
      : 30;

    if (playedSeconds < threshold) return;

    playTrackRequestInFlightRef.current = true;
    try {
      const response = await fetch(`/api/tracks/${encodeURIComponent(currentTrack.id)}/play`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playedSeconds,
          durationSeconds,
        }),
      });

      if (response.ok) {
        playTrackedTrackIdRef.current = currentTrack.id;
      }
    } catch (error) {
      logClientError('Failed to track play:', error);
    } finally {
      playTrackRequestInFlightRef.current = false;
    }
  }, [currentTrack]);

  playRandomTrackRef.current = () => {
    if (queue.length < 2) {
      setIsPlaying(false);
      return;
    }

    const current = currentIndex;
    const candidates = queue
      .map((_, idx) => idx)
      .filter((idx) => idx !== current);

    if (!candidates.length) {
      setIsPlaying(false);
      return;
    }

    const randomIdx = candidates[Math.floor(Math.random() * candidates.length)];
    if (current >= 0) {
      shuffleHistoryRef.current.push(current);
    }
    setQueueAndPlay(queue, randomIdx);
  };

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

        wavesurfer.current.load(resolveAudioSource(currentTrack.audio));

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
            const durationSeconds = Math.floor(wavesurfer.current.getDuration() || 0);
            trackPlayIfEligible(nextSecond, durationSeconds);
          }
        });

        wavesurfer.current.on("play", () => setIsPlaying(true));
        wavesurfer.current.on("pause", () => setIsPlaying(false));

        wavesurfer.current.on("error", (error) => {
          logClientError('WaveSurfer error:', error);
        });

        wavesurfer.current.on('finish', () => {
          if (repeatModeRef.current === "one") {
            if (!wavesurfer.current) return;
            wavesurfer.current.seekTo(0);
            wavesurfer.current.play();
          } else if (isShuffleEnabledRef.current && queue.length > 1) {
            playRandomTrackRef.current();
          } else if (repeatModeRef.current === "all" && currentIndex >= queue.length - 1 && queue.length > 0) {
            setQueueAndPlay(queue, 0);
          } else {
            playNextTrack();
          }
        });

        // Set initial volume
        wavesurfer.current.setVolume(volumeRef.current);
      });
    }
  }, [currentTrack, setIsPlaying, playNextTrack, queue, currentIndex, setQueueAndPlay, trackPlayIfEligible]);

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

  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= queue.length - 1) return;
    if (isShuffleEnabled) return;
    const nextTrack = queue[currentIndex + 1];
    if (!nextTrack?.audio) return;
    preloadAudio(nextTrack.audio);
  }, [currentIndex, queue, isShuffleEnabled]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(newVolume);
    }
  };

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  const hasPrev = isShuffleEnabled
    ? shuffleHistoryRef.current.length > 0
    : currentIndex > 0 || (repeatMode === "all" && queue.length > 1);
  const hasNext = isShuffleEnabled
    ? queue.length > 1
    : (currentIndex >= 0 && currentIndex < queue.length - 1) || (repeatMode === "all" && queue.length > 1);

  const cycleRepeatMode = () => {
    setRepeatMode((mode) => {
      if (mode === "off") return "all";
      if (mode === "all") return "one";
      return "off";
    });
  };

  const repeatTitle = repeatMode === "one" ? t.player.repeatOne : t.player.loop;

  const handleNext = () => {
    if (isShuffleEnabled) {
      playRandomTrackRef.current();
      return;
    }
    if (repeatMode === "all" && currentIndex >= queue.length - 1 && queue.length > 0) {
      setQueueAndPlay(queue, 0);
      return;
    }
    playNextTrack();
  };
  const handlePrev = () => {
    if (wavesurfer.current && wavesurfer.current.getCurrentTime() > 3) {
      wavesurfer.current.seekTo(0);
      return;
    }
    if (isShuffleEnabled) {
      const previousIndex = shuffleHistoryRef.current.pop();
      if (typeof previousIndex === "number" && previousIndex >= 0 && previousIndex < queue.length) {
        setQueueAndPlay(queue, previousIndex);
      }
      return;
    }
    if (repeatMode === "all" && currentIndex === 0 && queue.length > 1) {
      setQueueAndPlay(queue, queue.length - 1);
      return;
    }
    playPrevTrack();
  };
  const closePlayer = () => {
    clearPlayback();
    setCurrentTime(0);
    setDuration(0);
  };

  const handleDesktopDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    const panel = desktopPanelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    draggingRef.current = true;
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!draggingRef.current) return;
      const next = clampDesktopPosition(
        moveEvent.clientX - dragOffsetRef.current.x,
        moveEvent.clientY - dragOffsetRef.current.y,
      );
      setDesktopPosition(next);
    };

    const onPointerUp = () => {
      draggingRef.current = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  if (!currentTrack) return null;

  const playerContent = (
    <>
      <div ref={waveformRef} className="mb-2" />

      <div className="flex justify-between text-[11px] text-gray-400 mb-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="basis-2/5 min-w-0 flex items-center gap-2">
          <Image
            src={resolveTrackAssetSource(currentTrack.cover)}
            alt={`${currentTrack.title} cover`}
            width={40}
            height={40}
            sizes="40px"
            className="w-10 h-10 object-contain bg-neutral-950 shrink-0"
          />
          <div className="min-w-0">
            <div className="overflow-hidden whitespace-nowrap text-sm font-semibold leading-tight">
              <span className="block truncate">{currentTrack.title}</span>
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="basis-3/5 min-w-0 flex items-center justify-end gap-0.5">
          <button
            onClick={() => {
              setIsShuffleEnabled((value) => {
                const nextValue = !value;
                if (!nextValue) {
                  shuffleHistoryRef.current = [];
                }
                return nextValue;
              });
            }}
            disabled={queue.length < 2}
            className={`p-2 disabled:opacity-40 disabled:cursor-not-allowed ${isShuffleEnabled ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
            title={t.player.shuffle}
          >
            <Shuffle className="w-4 h-4" />
          </button>
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
            onClick={handleNext}
            disabled={!hasNext}
            className="text-gray-400 hover:text-white p-2 disabled:opacity-40 disabled:cursor-not-allowed"
            title={t.player.next}
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={cycleRepeatMode}
            className={`relative p-2 ${repeatMode === 'off' ? 'text-gray-400 hover:text-white' : 'text-orange-500'}`}
            title={repeatTitle}
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === "one" ? (
              <span className="absolute -top-0.5 right-0 text-[12px] leading-none font-bold">1</span>
            ) : null}
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
    </>
  );

  return (
    <div>
      {isDesktop ? (
        <div
          ref={desktopPanelRef}
          className="fixed z-50 w-[min(92vw,560px)] bg-black/95 text-white px-3 pt-2 pb-3 rounded-xl border border-neutral-800 shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
          style={{ left: desktopPosition.x, top: desktopPosition.y }}
        >
          <div
            className="h-4 mb-1 cursor-move touch-none"
            onPointerDown={handleDesktopDragStart}
            aria-hidden
          />
          {playerContent}
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 bg-black text-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-50">
          <div className="max-w-7xl mx-auto">
            {playerContent}
          </div>
        </div>
      )}
      <style jsx>{`
      `}</style>
    </div>
  );
}
