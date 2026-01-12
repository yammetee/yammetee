'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAudio } from '../contexts/AudioContext';

interface Track {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
}

export default function Tracks() {
  const { t } = useLanguage();
  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying } = useAudio();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const response = await fetch('/tracks/dead_air/dead_air.json');
        if (response.ok) {
          const track = await response.json();
          setTracks([track]);
        }
      } catch (error) {
        console.error('Error loading tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, []);

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] md:grid-cols-[repeat(auto-fit,minmax(18.75rem,18.75rem))] gap-4">
        {tracks.map((track) => (
          <Link key={track.id} href={`/tracks/${track.id}`}>
            <div className="bg-neutral-800 rounded-lg overflow-hidden shadow-lg hover:bg-neutral-700 transition-colors cursor-pointer group">
              {/* Обложка */}
              <div className="relative aspect-square">
                <Image
                width={300}
                height={300}
                  src={`/tracks/${track.id}/IMG_3310 (1).jpg`}
                  alt={`${track.title} cover`}
                  className="w-full h-full object-cover rounded"
                />
              </div>

              {/* Информация */}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playTrack(track);
                    }}
                    className="p-1 rounded bg-green-800 hover:bg-green-700 transition-colors"
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                  <h3 className="text-lg font-semibold">{track.title}</h3>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}