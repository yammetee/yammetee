'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAudio } from '../contexts/AudioContext';
import { loadAllReleases } from '../lib/releases';
import type { Release } from '../types/release';
import { createSupabaseBrowserClient } from '../lib/supabase/client';
import { Heart, Pause, Play } from 'lucide-react';
import LoadingGlow from '../components/LoadingGlow';
import { preloadAudio } from '../lib/audio-preload';
import { dedupePromise, fetchJsonDedupe } from '../lib/request-dedupe';
import { logClientError } from '../lib/client-log';

interface FlatTrack {
  id: string;
  title: string;
  artist: string;
  audio: string;
  cover: string;
  lyrics: string;
  releaseTitles: string[];
}

interface TrackStatsMap {
  [trackId: string]: {
    playsTotal: number;
    uniqueListeners: number;
  };
}

export default function AllTracksPage() {
  const { t, language } = useLanguage();
  const { currentTrack, isPlaying, setQueueAndPlay, setIsPlaying } = useAudio();
  const [releases, setReleases] = useState<Release[]>([]);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [likingTrackId, setLikingTrackId] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [trackStats, setTrackStats] = useState<TrackStatsMap>({});
  const [loading, setLoading] = useState(true);
  const loadingText = language === 'ru' ? 'загрузка...' : 'loading...';

  useEffect(() => {
    const load = async () => {
      try {
        const loadedReleases = await dedupePromise<Release[]>('GET:/tracks/releases', () => loadAllReleases());
        setReleases(loadedReleases);

        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setIsAuthed(true);
          const likesResult = await fetchJsonDedupe<{ likedTrackIds?: string[] }>(
            'GET:/api/me/liked-tracks',
            '/api/me/liked-tracks',
          );
          if (likesResult.ok && likesResult.data) {
            setLikedTrackIds(likesResult.data.likedTrackIds || []);
          }
        }
      } catch (error) {
        logClientError('Error loading all tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const tracks = useMemo<FlatTrack[]>(() => {
    const byId = new Map<string, FlatTrack>();

    releases.forEach((release) => {
      release.tracks.forEach((track) => {
        const existing = byId.get(track.id);
        if (existing) {
          if (!existing.releaseTitles.includes(release.title)) {
            existing.releaseTitles.push(release.title);
          }
          return;
        }

        byId.set(track.id, {
          id: track.id,
          title: track.title,
          artist: track.artist || release.artist,
          audio: track.audio,
          cover: release.cover,
          lyrics: track.lyrics || '',
          releaseTitles: [release.title],
        });
      });
    });

    return Array.from(byId.values());
  }, [releases]);

  const sortedTracks = useMemo<FlatTrack[]>(() => {
    return [...tracks].sort((a, b) => {
      const playsA = trackStats[a.id]?.playsTotal || 0;
      const playsB = trackStats[b.id]?.playsTotal || 0;
      if (playsB !== playsA) return playsB - playsA;
      const titleCompare = a.title.localeCompare(b.title, 'ru');
      if (titleCompare !== 0) return titleCompare;
      return a.id.localeCompare(b.id);
    });
  }, [tracks, trackStats]);

  useEffect(() => {
    const ids = [...new Set(tracks.map((track) => track.id).filter(Boolean))];
    if (!ids.length) {
      setTrackStats({});
      return;
    }

    const loadStats = async () => {
      try {
        const response = await fetch(`/api/tracks/stats?ids=${encodeURIComponent(ids.join(','))}`);
        if (!response.ok) return;
        const payload = await response.json();
        setTrackStats(payload.stats || {});
      } catch (error) {
        logClientError('Error loading track stats:', error);
      }
    };

    loadStats();
  }, [tracks]);

  const playTrack = (trackId: string) => {
    const queue = sortedTracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      audio: track.audio,
      cover: track.cover,
      lyrics: track.lyrics,
    }));

    const trackIndex = queue.findIndex((item) => item.id === trackId);
    const selected = queue[trackIndex];
    if (!selected) return;

    if (currentTrack?.id === selected.id) {
      setIsPlaying(!isPlaying);
      return;
    }

    setQueueAndPlay(queue, trackIndex);
  };

  const toggleLike = async (trackId: string) => {
    setLikingTrackId(trackId);
    try {
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
    } finally {
      setLikingTrackId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingGlow text={loadingText} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {likingTrackId ? <LoadingGlow overlay text={loadingText} /> : null}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.allTracks.title}</h1>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="divide-y divide-neutral-800">
          {sortedTracks.map((track) => {
            const active = currentTrack?.audio === track.audio && isPlaying;
            const isLiked = likedTrackIds.includes(track.id) || likedTrackIds.includes(track.audio);
            return (
              <div key={track.id} className="px-4 py-3 hover:bg-neutral-800 transition-colors flex items-center justify-between gap-3 cursor-pointer">
                <button
                  onClick={() => playTrack(track.id)}
                  onMouseEnter={() => preloadAudio(track.audio)}
                  className="flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-gray-400 shrink-0 inline-flex items-center justify-center w-4 h-4"
                      aria-label={active ? t.allTracks.playing : t.tracks.play}
                    >
                      {active ? (
                        <Pause className="w-4 h-4 block" />
                      ) : (
                        <Play className="w-4 h-4 block" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{track.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {track.artist} · {t.allTracks.release}: {track.releaseTitles.join(', ')} · {trackStats[track.id]?.playsTotal || 0} {language === 'ru' ? 'просл.' : 'plays'}
                      </p>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleLike(track.id);
                    }}
                    disabled={!isAuthed || likingTrackId === track.id}
                    className="p-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isLiked ? t.allTracks.unlike : t.allTracks.like}
                  >
                    <Heart
                      size={16}
                      className={isLiked ? 'text-red-500 fill-red-500' : 'text-gray-300'}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
