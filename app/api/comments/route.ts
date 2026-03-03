import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createSupabaseServerClient } from '../../lib/supabase/server';

const commentsFilePath = path.join(process.cwd(), 'app/data/comments.json');
const profilesFilePath = path.join(process.cwd(), 'app/data/profiles.json');

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

function buildDisplayName(user: { email?: string | null }, profile?: UserProfile) {
  const nickname = profile?.nickname?.trim() || '';
  if (nickname) return nickname;

  const firstName = profile?.firstName?.trim() || '';
  const lastName = profile?.lastName?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;

  return user.email || 'User';
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isAnonymous: boolean;
  userId?: string;
  avatar?: string;
  likes: number;
}

// GET /api/comments - получить все комментарии
export async function GET() {
  try {
    const fileContents = fs.readFileSync(commentsFilePath, 'utf8');
    const comments: Comment[] = JSON.parse(fileContents);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error reading comments:', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

// POST /api/comments - добавить комментарий
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { author, content, isAnonymous } = await request.json();
    if (!content || typeof isAnonymous !== 'boolean') {
      return NextResponse.json({ error: 'Content and isAnonymous are required' }, { status: 400 });
    }

    const fileContents = fs.readFileSync(commentsFilePath, 'utf8');
    const comments: Comment[] = JSON.parse(fileContents);

    const existingComment = comments.find((c) => c.userId === user.id);
    if (existingComment) {
      return NextResponse.json({ error: 'You can only leave one comment' }, { status: 409 });
    }

    const profiles = readProfiles();
    const profile = profiles[user.id];
    const fallbackDisplayName = buildDisplayName(user, profile);
    const customAuthor = typeof author === 'string' ? author.trim() : '';
    const displayName = customAuthor || fallbackDisplayName;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: isAnonymous ? 'Anonymous' : displayName,
      content,
      createdAt: new Date().toISOString(),
      isAnonymous,
      userId: user.id,
      avatar: undefined,
      likes: 0,
    };

    comments.push(newComment);
    fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
