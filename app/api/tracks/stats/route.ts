import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

const MAX_IDS = 200;

function parseIds(input: string | null): string[] {
  if (!input) return [];
  return [...new Set(
    input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_IDS),
  )];
}

export async function GET(request: NextRequest) {
  try {
    const ids = parseIds(request.nextUrl.searchParams.get('ids'));
    if (!ids.length) {
      return NextResponse.json({ stats: {} });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('track_stats')
      .select('track_id, plays_total, unique_listeners')
      .in('track_id', ids);

    if (error) {
      console.error('Error loading track stats:', error);
      return NextResponse.json({ error: 'Failed to load track stats' }, { status: 500 });
    }

    const map: Record<string, { playsTotal: number; uniqueListeners: number }> = {};
    for (const id of ids) {
      map[id] = { playsTotal: 0, uniqueListeners: 0 };
    }

    for (const row of data || []) {
      const trackId = String(row.track_id || '');
      if (!trackId) continue;
      map[trackId] = {
        playsTotal: Number(row.plays_total || 0),
        uniqueListeners: Number(row.unique_listeners || 0),
      };
    }

    return NextResponse.json({ stats: map });
  } catch (error) {
    console.error('Error in stats endpoint:', error);
    return NextResponse.json({ error: 'Failed to load track stats' }, { status: 500 });
  }
}
