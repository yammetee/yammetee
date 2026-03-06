import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../lib/supabase/server';

interface UserProfile {
  firstName?: string;
  lastName?: string;
  nickname?: string;
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

interface DbCommentRow {
  id: string;
  author: string;
  content: string;
  is_anonymous: boolean;
  user_id: string;
  likes: number;
  created_at: string;
}

function mapDbComment(row: DbCommentRow): Comment {
  return {
    id: row.id,
    author: row.author,
    content: row.content,
    createdAt: row.created_at,
    isAnonymous: row.is_anonymous,
    userId: row.user_id,
    avatar: undefined,
    likes: row.likes || 0,
  };
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('comments')
      .select('id, author, content, is_anonymous, user_id, likes, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json((data || []).map((row) => mapDbComment(row as DbCommentRow)));
  } catch (error) {
    console.error('Error reading comments:', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

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

    const { data: existingComment, error: existingError } = await supabase
      .from('comments')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (existingError) {
      throw existingError;
    }
    if (existingComment) {
      return NextResponse.json({ error: 'You can only leave one comment' }, { status: 409 });
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, nickname')
      .eq('user_id', user.id)
      .maybeSingle();
    if (profileError) {
      throw profileError;
    }

    const profile: UserProfile | undefined = profileRow
      ? {
          firstName: profileRow.first_name,
          lastName: profileRow.last_name,
          nickname: profileRow.nickname,
        }
      : undefined;

    const fallbackDisplayName = buildDisplayName(user, profile);
    const customAuthor = typeof author === 'string' ? author.trim() : '';
    const displayName = customAuthor || fallbackDisplayName;

    const { data: insertedComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        author: isAnonymous ? 'Anonymous' : displayName,
        content,
        is_anonymous: isAnonymous,
      })
      .select('id, author, content, is_anonymous, user_id, likes, created_at')
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(mapDbComment(insertedComment as DbCommentRow), { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
