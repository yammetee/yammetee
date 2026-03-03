import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createSupabaseServerClient } from '../../../lib/supabase/server';

const likesFilePath = path.join(process.cwd(), 'app/data/liked_tracks.json');

type LikesMap = Record<string, string[]>;

function readLikes(): LikesMap {
  try {
    const content = fs.readFileSync(likesFilePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function writeLikes(data: LikesMap) {
  fs.writeFileSync(likesFilePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const likes = readLikes();
  return NextResponse.json({ likedTrackIds: likes[user.id] || [] });
}

export async function PATCH(request: NextRequest) {
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

  const likes = readLikes();
  const userLikes = new Set(likes[user.id] || []);

  let liked: boolean;
  if (userLikes.has(trackId)) {
    userLikes.delete(trackId);
    liked = false;
  } else {
    userLikes.add(trackId);
    liked = true;
  }

  likes[user.id] = Array.from(userLikes);
  writeLikes(likes);

  return NextResponse.json({
    liked,
    likedTrackIds: likes[user.id],
  });
}
