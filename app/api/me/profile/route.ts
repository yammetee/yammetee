import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import type { Comment } from '../../comments/route';
import { NextRequest } from 'next/server';

const commentsFilePath = path.join(process.cwd(), 'app/data/comments.json');
const profilesFilePath = path.join(process.cwd(), 'app/data/profiles.json');
const ADMIN_EMAIL = 'a.luganko@gmail.com';

interface UserProfile {
  firstName?: string;
  lastName?: string;
  nickname?: string;
}

type UserProfilesMap = Record<string, UserProfile>;

function readProfiles(): UserProfilesMap {
  try {
    const fileContents = fs.readFileSync(profilesFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return {};
  }
}

function writeProfiles(data: UserProfilesMap) {
  fs.writeFileSync(profilesFilePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userCommentId: string | null = null;
    try {
      const fileContents = fs.readFileSync(commentsFilePath, 'utf8');
      const comments: Comment[] = JSON.parse(fileContents);
      const userComment = comments.find((comment) => comment.userId === user.id);
      userCommentId = userComment?.id ?? null;
    } catch {
      userCommentId = null;
    }

    const profiles = readProfiles();
    const userProfile = profiles[user.id] || {};

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      isAdmin: (user.email || '').toLowerCase() === ADMIN_EMAIL,
      createdAt: user.created_at,
      userCommentId,
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
      nickname: userProfile.nickname || '',
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
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

    const body = await request.json();
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';

    const profiles = readProfiles();
    profiles[user.id] = { firstName, lastName, nickname };
    writeProfiles(profiles);

    return NextResponse.json(profiles[user.id]);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
