'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { loadAllReleases } from "../lib/releases";
import type { Release } from "../types/release";
import LoadingGlow from '../components/LoadingGlow';
import { preloadAudio } from '../lib/audio-preload';
import { resolveTrackAssetSource } from '../lib/audio-source';
import { dedupePromise } from '../lib/request-dedupe';
import { logClientError } from '../lib/client-log';

export default function TracksPageClient() {
  const { t, language } = useLanguage();
  const { currentTrack, isPlaying, setQueueAndPlay, setIsPlaying } = useAudio();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingText = language === 'ru' ? 'загрузка...' : 'loading...';
  const albumsTitle = language === 'ru' ? 'Альбомы' : 'Albums';
  const singlesTitle = language === 'ru' ? 'Синглы' : 'Singles';

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const loadedReleases = await dedupePromise<Release[]>('GET:/tracks/releases', () => loadAllReleases());
        setReleases(loadedReleases);
      } catch (error) {
        logClientError('Error loading tracks:', error);
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

  const isSingleRelease = (release: Release) =>
    release.releaseType.trim().toLowerCase() === 'single';

  const albumReleases = releases.filter((release) => !isSingleRelease(release));
  const singleReleases = releases.filter((release) => isSingleRelease(release));

  const renderReleasesGrid = (items: Release[]) => (
    <div className="flex flex-wrap gap-3">
      {items.map((release) => {
        const coverSrc = resolveTrackAssetSource(release.cover);
        return (
          <Link
            key={release.id}
            href={`/tracks/${release.id}`}
            className="w-full sm:w-auto"
            onMouseEnter={() => {
              if (release.tracks[0]?.audio) preloadAudio(release.tracks[0].audio);
            }}
          >
            <div className="w-full sm:w-[192px] bg-neutral-900 overflow-hidden border border-neutral-800 hover:border-neutral-600 transition-colors cursor-pointer group">
              <div className="relative aspect-square">
                <Image
                  width={500}
                  height={500}
                  src={coverSrc}
                  alt={`${release.title} cover`}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
                  className="w-full h-full object-contain bg-neutral-950"
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
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
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
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingGlow text={loadingText} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.tracks.title}</h1>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-3">{albumsTitle}</h2>
          {renderReleasesGrid(albumReleases)}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">{singlesTitle}</h2>
          {renderReleasesGrid(singleReleases)}
        </section>
      </div>
    </div>
  );
}
