'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { loadAllReleases } from '../lib/releases';
import type { Release } from '../types/release';
import LoadingGlow from '../components/LoadingGlow';

interface ProfileData {
  email: string;
  createdAt: string;
  userCommentId: string | null;
  firstName: string;
  lastName: string;
  nickname: string;
}

interface LikedTracksData {
  likedTrackIds: string[];
}

interface FlatTrack {
  id: string;
  title: string;
  audio: string;
  releaseTitle: string;
}

function buildAvatarLabel(profile: ProfileData | null) {
  if (!profile) return '--';

  const nickname = profile.nickname?.trim() || '';
  if (nickname) {
    const words = nickname.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
    }
    return (words[0]?.slice(0, 1) || '').toUpperCase() || '--';
  }

  const firstName = profile.firstName?.trim() || '';
  const lastName = profile.lastName?.trim() || '';
  if (firstName || lastName) {
    const first = firstName.slice(0, 1);
    const last = lastName.slice(0, 1);
    const combined = `${first}${last}`.toUpperCase();
    return combined || firstName.slice(0, 2).toUpperCase() || lastName.slice(0, 2).toUpperCase();
  }

  return (profile.email || '').slice(0, 2).toUpperCase() || '--';
}

export default function AccountPage() {
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadingText = language === 'ru' ? 'загрузка...' : 'loading...';

  useEffect(() => {
    const load = async () => {
      try {
        const [profileResponse, likesResponse, releaseData] = await Promise.all([
          fetch('/api/me/profile'),
          fetch('/api/me/liked-tracks'),
          loadAllReleases(),
        ]);

        if (profileResponse.ok) {
          const profileData: ProfileData = await profileResponse.json();
          setProfile(profileData);
          setFirstName(profileData.firstName || '');
          setLastName(profileData.lastName || '');
          setNickname(profileData.nickname || '');
        }

        if (likesResponse.ok) {
          const likeData: LikedTracksData = await likesResponse.json();
          setLikedTrackIds(likeData.likedTrackIds || []);
        }

        setReleases(releaseData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const response = await fetch('/api/me/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firstName, lastName, nickname }),
    });

    setSaving(false);

    if (!response.ok) return;

    const updated = await response.json();
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        nickname: updated.nickname || '',
      };
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const allTracks = useMemo<FlatTrack[]>(() => {
    const tracks: FlatTrack[] = [];
    releases.forEach((release) => {
      release.tracks.forEach((track) => {
        tracks.push({
          id: track.id,
          title: track.title,
          audio: track.audio,
          releaseTitle: release.title,
        });
      });
    });
    return tracks;
  }, [releases]);

  const likedTracks = allTracks.filter((track) => likedTrackIds.includes(track.audio));
  const avatarLabel = buildAvatarLabel({
    ...(profile || {
      email: '',
      createdAt: '',
      userCommentId: null,
      firstName: '',
      lastName: '',
      nickname: '',
    }),
    firstName,
    lastName,
    nickname,
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingGlow text={loadingText} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {saving ? <LoadingGlow overlay text={loadingText} /> : null}
      <h1 className="text-3xl font-bold">{t.account.title}</h1>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-neutral-700 flex items-center justify-center text-lg font-semibold">
            {avatarLabel}
          </div>
          <div className="text-sm text-gray-300">
            <p><span className="text-gray-400">{t.account.email}: </span>{profile?.email || '-'}</p>
            <p><span className="text-gray-400">{t.account.createdAt}: </span>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-3">
          <h2 className="text-xl font-semibold">{t.account.editProfile}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t.account.firstName}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-md border border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t.account.lastName}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-md border border-neutral-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t.account.nickname}</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 rounded-md border border-neutral-700"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-white text-black font-medium disabled:opacity-60"
            >
              {t.account.saveProfile}
            </button>
            {saved ? <span className="text-sm text-green-400">{t.account.profileSaved}</span> : null}
          </div>
        </form>

        {profile?.userCommentId ? (
          <Link href={`/wall#comment-${profile.userCommentId}`} className="text-white underline">
            {t.account.wallLink}
          </Link>
        ) : (
          <p className="text-gray-400">{t.account.noComment}</p>
        )}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <h2 className="text-xl font-semibold mb-3">{t.account.likedTracks}</h2>
        {likedTracks.length === 0 ? (
          <p className="text-gray-400">{t.account.noLikedTracks}</p>
        ) : (
          <ul className="space-y-2">
            {likedTracks.map((track) => (
              <li key={track.audio} className="text-sm">
                {track.title} <span className="text-gray-500">({track.releaseTitle})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
