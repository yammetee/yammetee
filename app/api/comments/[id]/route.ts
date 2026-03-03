import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import type { Comment } from '../route';

const commentsFilePath = path.join(process.cwd(), 'app/data/comments.json');
const ADMIN_EMAIL = 'a.luganko@gmail.com';

function readComments(): Comment[] {
  try {
    const fileContents = fs.readFileSync(commentsFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return [];
  }
}

function writeComments(comments: Comment[]) {
  fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { author, content, isAnonymous } = await request.json();
    if (!content || typeof isAnonymous !== 'boolean') {
      return NextResponse.json({ error: 'Content and isAnonymous are required' }, { status: 400 });
    }

    const comments = readComments();
    const commentIndex = comments.findIndex((c) => c.id === id);
    if (commentIndex === -1) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL;
    if (comments[commentIndex].userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const safeAuthor = typeof author === 'string' ? author.trim() : comments[commentIndex].author;

    comments[commentIndex] = {
      ...comments[commentIndex],
      author: isAnonymous ? 'Anonymous' : (safeAuthor || comments[commentIndex].author),
      content,
      isAnonymous,
    };

    writeComments(comments);

    return NextResponse.json(comments[commentIndex]);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const comments = readComments();
    const commentIndex = comments.findIndex((c) => c.id === id);
    if (commentIndex === -1) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL;
    if (comments[commentIndex].userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    comments.splice(commentIndex, 1);
    writeComments(comments);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
