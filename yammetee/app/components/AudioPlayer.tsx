'use client';

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Heart, Repeat, Volume2 } from "lucide-react";
import Image from "next/image";
import { useAudio } from "../contexts/AudioContext";

export default function AudioPlayer() {
  const { currentTrack, isPlaying, setIsPlaying } = useAudio();
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);
  const isLoopingRef = useRef(false);
  const creatingTrackIdRef = useRef(null);
  const volumeRef = useRef(1);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (currentTrack && waveformRef.current) {
      if (creatingTrackIdRef.current === currentTrack.id) return; // already creating for this track

      creatingTrackIdRef.current = currentTrack.id;

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
          height: 70,
          cursorWidth: 0,
          responsive: true,
        });

        wavesurfer.current.load(`/tracks/${currentTrack.id}/Yamme Tee - Dead Air.mp3`);

        wavesurfer.current.on("ready", () => {
          console.log('WaveSurfer ready, duration:', wavesurfer.current.getDuration());
          setDuration(Math.floor(wavesurfer.current.getDuration()));
          if (isPlayingRef.current) {
            wavesurfer.current.play();
          }
        });

        wavesurfer.current.on("audioprocess", () => {
          setCurrentTime(Math.floor(wavesurfer.current.getCurrentTime()));
        });

        wavesurfer.current.on("play", () => setIsPlaying(true));
        wavesurfer.current.on("pause", () => setIsPlaying(false));

        wavesurfer.current.on("error", (error) => {
          console.error('WaveSurfer error:', error);
        });

        wavesurfer.current.on('finish', () => {
          if (isLoopingRef.current) {
            wavesurfer.current.seekTo(0);
            wavesurfer.current.play();
          }
        });

        // Set initial volume
        wavesurfer.current.setVolume(volumeRef.current);
      });
    }
  }, [currentTrack, setIsPlaying]);

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

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 z-50">
      <div className="max-w-7xl mx-auto">
        <div ref={waveformRef} className="mb-4" />

        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-1">
          <Image src={`/tracks/${currentTrack.id}/IMG_3310 (1).jpg`} alt={`${currentTrack.title} cover`} width={56} height={56} className="w-14 h-14 rounded-lg object-cover" />

          <div className="flex-1">
            <h3 className="font-semibold text-sm md:text-base truncate">{currentTrack.title}</h3>
            <p className="text-xs md:text-sm text-gray-400 truncate">{currentTrack.artist}</p>
          </div>

          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5" />
            <button onClick={() => setIsPlaying(!isPlaying)} className="bg-white text-black p-3 rounded-full">
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button
              onClick={toggleLoop}
              className={`${isLooping ? 'text-orange-500' : 'text-gray-400 hover:text-white'}`}
              title="Loop"
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-white p-2" title="Volume">
                <Volume2 className="w-5 h-5" />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}