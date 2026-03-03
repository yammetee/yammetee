'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAudio } from '../contexts/AudioContext';
import { loadAllReleases } from "../lib/releases";
import type { Release } from "../types/release";

export default function Tracks() {
  const { t } = useLanguage();
  const { currentTrack, isPlaying, setQueueAndPlay, setIsPlaying } = useAudio();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const loadedReleases = await loadAllReleases();
        setReleases(loadedReleases);
      } catch (error) {
        console.error('Error loading tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, []);

  const playRelease = (release: Release) => {
    const firstTrack = release.tracks[0];
    if (!firstTrack) return;

    const queue = release.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist || release.artist,
      audio: track.audio,
      cover: release.cover,
      lyrics: track.lyrics || '',
    }));

    if (currentTrack?.id === firstTrack.id) {
      setIsPlaying(!isPlaying);
    } else {
      setQueueAndPlay(queue, 0);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">{t.tracks.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.tracks.title}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {releases.map((release) => (
          <Link key={release.id} href={`/tracks/${release.id}`}>
            <div className="bg-neutral-900 overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors cursor-pointer group">
              <div className="relative aspect-square">
                <Image
                  width={500}
                  height={500}
                  src={release.cover}
                  alt={`${release.title} cover`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playRelease(release);
                  }}
                  className="absolute bottom-2 right-2 p-2 rounded-full bg-white text-black hover:scale-105 transition-transform shadow-lg"
                >
                  {currentTrack && currentTrack.audio === release.tracks[0]?.audio && isPlaying ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              </div>

              <div className="p-2.5">
                <div className="text-xs uppercase tracking-[0.12em] text-gray-400">{release.releaseType}</div>
                <h3 className="text-sm font-semibold mt-1 truncate">{release.title}</h3>
                <p className="text-xs text-gray-400 truncate">{release.artist}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
