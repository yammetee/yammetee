'use client';

import { useLanguage } from '../../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useAudio } from '../../contexts/AudioContext';
import { loadReleaseById } from "../../lib/releases";
import type { Release, ReleaseTrack } from "../../types/release";

export default function TrackDetail() {
  const { t } = useLanguage();
  const params = useParams();
  const id = params.id as string;
  const { currentTrack, isPlaying, setQueueAndPlay, setIsPlaying } = useAudio();
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrack = async () => {
      try {
        const data = await loadReleaseById(id);
        setRelease(data);
      } catch (error) {
        console.error('Error loading track:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTrack();
    }
  }, [id]);

  const playTrack = (track: ReleaseTrack) => {
    if (!release) return;

    const queue = release.tracks.map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.artist || release.artist,
      cover: release.cover,
      audio: item.audio,
      lyrics: item.lyrics || '',
    }));
    const trackIndex = release.tracks.findIndex((item) => item.id === track.id);

    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
      return;
    }

    setQueueAndPlay(queue, trackIndex >= 0 ? trackIndex : 0);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">{t.tracks.loading}</div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">{t.tracks.notFound}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-shrink-0 lg:w-1/3">
          <div className="flex flex-col items-center gap-4">
            <Image
              src={release.cover}
              alt={`${release.title} cover`}
              width={400}
              height={400}
              className="w-full max-w-md shadow-lg"
            />
            <div className="text-center">
              <div className="text-xs uppercase tracking-[0.12em] text-gray-400">{release.releaseType}</div>
              <h1 className="text-3xl font-bold mt-2">{release.title}</h1>
              <p className="text-gray-400 mt-1">{release.artist}</p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(release.releaseDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-neutral-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{t.tracks.tracklist}</h2>
            <div className="space-y-2">
              {release.tracks.map((track) => {
                const active = currentTrack?.audio === track.audio && isPlaying;
                return (
                  <button
                    key={track.id}
                    onClick={() => playTrack(track)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">
                      {track.title}
                    </span>
                    <span className="text-sm text-gray-400">{active ? t.tracks.playing : t.tracks.play}</span>
                  </button>
                );
              })}
            </div>

            {currentTrack?.lyrics ? (
              <div className="mt-6 border-t border-neutral-700 pt-6">
                <h3 className="text-lg font-semibold mb-3">{t.tracks.lyrics}</h3>
                <pre className="whitespace-pre-wrap text-gray-300 font-mono leading-relaxed">
                  {currentTrack.lyrics}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
