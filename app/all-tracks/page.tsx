'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAudio } from '../contexts/AudioContext';
import { loadAllReleases } from '../lib/releases';
import type { Release } from '../types/release';
import { createSupabaseBrowserClient } from '../lib/supabase/client';
import { Heart } from 'lucide-react';

interface FlatTrack {
  id: string;
  title: string;
  artist: string;
  audio: string;
  cover: string;
  lyrics: string;
  releaseTitle: string;
}

export default function AllTracksPage() {
  const { t } = useLanguage();
  const { currentTrack, isPlaying, setQueueAndPlay, setIsPlaying } = useAudio();
  const [releases, setReleases] = useState<Release[]>([]);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const loadedReleases = await loadAllReleases();
        setReleases(loadedReleases);

        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setIsAuthed(true);
          const likesResponse = await fetch('/api/me/liked-tracks');
          if (likesResponse.ok) {
            const likesData = await likesResponse.json();
            setLikedTrackIds(likesData.likedTrackIds || []);
          }
        }
      } catch (error) {
        console.error('Error loading all tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const tracks = useMemo<FlatTrack[]>(() => {
    const list: FlatTrack[] = [];

    releases.forEach((release) => {
      release.tracks.forEach((track) => {
        list.push({
          id: track.id,
          title: track.title,
          artist: track.artist || release.artist,
          audio: track.audio,
          cover: release.cover,
          lyrics: track.lyrics || '',
          releaseTitle: release.title,
        });
      });
    });

    return list;
  }, [releases]);

  const playTrack = (trackIndex: number) => {
    const queue = tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      audio: track.audio,
      cover: track.cover,
      lyrics: track.lyrics,
    }));

    const selected = queue[trackIndex];
    if (!selected) return;

    if (currentTrack?.id === selected.id) {
      setIsPlaying(!isPlaying);
      return;
    }

    setQueueAndPlay(queue, trackIndex);
  };

  const toggleLike = async (trackId: string) => {
    const response = await fetch('/api/me/liked-tracks', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trackId }),
    });

    if (response.status === 401) {
      window.location.href = '/login?next=/all-tracks';
      return;
    }

    if (!response.ok) return;
    const data = await response.json();
    setLikedTrackIds(data.likedTrackIds || []);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">{t.allTracks.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.allTracks.title}</h1>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="divide-y divide-neutral-800">
          {tracks.map((track, index) => {
            const active = currentTrack?.audio === track.audio && isPlaying;
            return (
              <div key={`${track.audio}-${index}`} className="px-4 py-3 hover:bg-neutral-800 transition-colors flex items-center justify-between gap-3">
                <button onClick={() => playTrack(index)} className="flex-1 min-w-0 text-left">
                  <p className="font-medium truncate">{track.title}</p>
                  <p className="text-xs text-gray-400 truncate">{track.artist} · {t.allTracks.release}: {track.releaseTitle}</p>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleLike(track.audio);
                    }}
                    disabled={!isAuthed}
                    className="p-1.5 rounded-md border border-neutral-600 hover:border-white disabled:opacity-40 disabled:cursor-not-allowed"
                    title={likedTrackIds.includes(track.audio) ? t.allTracks.unlike : t.allTracks.like}
                  >
                    <Heart
                      size={16}
                      className={likedTrackIds.includes(track.audio) ? 'text-red-500 fill-red-500' : 'text-gray-300'}
                    />
                  </button>
                  {active ? <div className="text-xs text-gray-400 whitespace-nowrap">{t.allTracks.playing}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
