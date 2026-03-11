import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { toCanonicalTrackId } from '../../../lib/track-id';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_liked_tracks')
      .select('track_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      likedTrackIds: [...new Set((data || []).map((row) => toCanonicalTrackId(String(row.track_id || ''))).filter(Boolean))],
    });
  } catch (error) {
    console.error('Failed to load liked tracks:', error);
    return NextResponse.json({ error: 'Failed to load liked tracks' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trackId } = await request.json();
    if (!trackId || typeof trackId !== 'string') {
      return NextResponse.json({ error: 'trackId is required' }, { status: 400 });
    }
    const canonicalTrackId = toCanonicalTrackId(trackId);

    const { data: existingLike, error: findError } = await supabase
      .from('user_liked_tracks')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('track_id', canonicalTrackId)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    let liked = false;
    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('user_liked_tracks')
        .delete()
        .eq('user_id', user.id)
        .eq('track_id', canonicalTrackId);

      if (deleteError) {
        throw deleteError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_liked_tracks')
        .insert({ user_id: user.id, track_id: canonicalTrackId });

      if (insertError) {
        throw insertError;
      }

      liked = true;
    }

    const { data: updatedLikes, error: updatedError } = await supabase
      .from('user_liked_tracks')
      .select('track_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (updatedError) {
      throw updatedError;
    }

    return NextResponse.json({
      liked,
      likedTrackIds: [...new Set((updatedLikes || []).map((row) => toCanonicalTrackId(String(row.track_id || ''))).filter(Boolean))],
    });
  } catch (error) {
    console.error('Failed to update liked tracks:', error);
    return NextResponse.json({ error: 'Failed to update liked tracks' }, { status: 500 });
  }
}
