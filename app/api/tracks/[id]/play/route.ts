import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import { toCanonicalTrackId } from '../../../../lib/track-id';

const PLAY_SESSION_COOKIE = 'yt_play_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;

function normalizeSeconds(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trackId = toCanonicalTrackId(String(id || '').trim());
    if (!trackId) {
      return NextResponse.json({ error: 'Invalid track id' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const playedSeconds = normalizeSeconds(body?.playedSeconds);
    const durationSeconds = normalizeSeconds(body?.durationSeconds);
    const thresholdSeconds = durationSeconds > 0
      ? Math.max(10, Math.min(30, Math.floor(durationSeconds * 0.5)))
      : 30;

    if (playedSeconds < thresholdSeconds) {
      return NextResponse.json({ accepted: false, reason: 'below-threshold' }, { status: 200 });
    }

    const existingSessionId = request.cookies.get(PLAY_SESSION_COOKIE)?.value;
    const sessionId = existingSessionId || randomUUID();

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc('register_track_play', {
      p_track_id: trackId,
      p_session_id: sessionId,
      p_played_seconds: playedSeconds,
    });

    if (error) {
      console.error('Error registering track play:', {
        trackId,
        code: error.code,
        message: error.message,
        hint: error.hint,
        details: error.details,
      });
      return NextResponse.json(
        {
          error: 'Failed to register play',
          code: error.code || null,
          message: error.message || null,
        },
        { status: 500 },
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    const response = NextResponse.json({
      accepted: Boolean(row?.accepted),
      trackId: row?.track_id || trackId,
      playsTotal: Number(row?.plays_total || 0),
      uniqueListeners: Number(row?.unique_listeners || 0),
    });

    if (!existingSessionId) {
      response.cookies.set({
        name: PLAY_SESSION_COOKIE,
        value: sessionId,
        path: '/',
        maxAge: SESSION_TTL_SECONDS,
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;
  } catch (error) {
    console.error('Error in play endpoint:', error);
    return NextResponse.json({ error: 'Failed to register play' }, { status: 500 });
  }
}
