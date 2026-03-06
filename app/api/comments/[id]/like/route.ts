import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

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
    const { data: incremented, error: incrementError } = await supabase
      .rpc('increment_comment_likes', { comment_id: id });

    if (incrementError) {
      throw incrementError;
    }

    const updatedComment = Array.isArray(incremented) ? incremented[0] : incremented;

    if (!updatedComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
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
    console.error('Error liking comment:', error);
    return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 });
  }
}
