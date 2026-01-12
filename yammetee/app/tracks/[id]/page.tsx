'use client';

import { useLanguage } from '../../contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useAudio } from '../../contexts/AudioContext';

interface Track {
  id: string;
  title: string;
  artist: string;
  lyrics: string;
}

export default function TrackDetail() {
  const { t } = useLanguage();
  const params = useParams();
  const id = params.id as string;
  const { setCurrentTrack, setIsPlaying } = useAudio();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrack = async () => {
      try {
        const response = await fetch(`/tracks/${id}/${id}.json`);
        if (response.ok) {
          const data = await response.json();
          setTrack(data);
          setCurrentTrack(data); // Автоматически загружаем в плеер
          setIsPlaying(true); // Автоматически начинаем воспроизведение
        }
      } catch (error) {
        console.error('Error loading track:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTrack();
    }
  }, [id, setCurrentTrack, setIsPlaying]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">{t.tracks.loading}</div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Track not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Левая часть: Обложка и название */}
        <div className="flex-shrink-0 lg:w-1/3">
          <div className="flex flex-col items-center gap-4">
            <Image
              src={`/tracks/${track.id}/IMG_3310 (1).jpg`}
              alt={`${track.title} cover`}
              width={400}
              height={400}
              className="w-full max-w-md rounded-lg shadow-lg"
            />
            <h1 className="text-3xl font-bold text-center">{track.title}</h1>
          </div>
        </div>

        {/* Правая часть: Текст песни */}
        <div className="flex-1">
          <div className="bg-neutral-900 rounded-lg p-6">
            <pre className="whitespace-pre-wrap text-gray-300 font-mono leading-relaxed">
              {track.lyrics}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}