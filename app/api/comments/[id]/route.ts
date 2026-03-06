import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
const ADMIN_EMAIL = 'a.luganko@gmail.com';

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

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id, author')
      .eq('id', id)
      .maybeSingle();

    if (commentError) {
      throw commentError;
    }

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL;
    if (comment.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const safeAuthor = typeof author === 'string' ? author.trim() : comment.author;
    const resolvedAuthor = isAnonymous ? 'Anonymous' : (safeAuthor || comment.author);

    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({
        author: resolvedAuthor,
        content,
        is_anonymous: isAnonymous,
      })
      .eq('id', id)
      .select('id, author, content, is_anonymous, user_id, likes, created_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      id: updatedComment.id,
      author: updatedComment.author,
      content: updatedComment.content,
      createdAt: updatedComment.created_at,
      isAnonymous: updatedComment.is_anonymous,
      userId: updatedComment.user_id,
      avatar: undefined,
      likes: updatedComment.likes || 0,
    });
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
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (commentError) {
      throw commentError;
    }

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isAdmin = (user.email || '').toLowerCase() === ADMIN_EMAIL;
    if (comment.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
