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
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid comment id' }, { status: 400 });
    }

    const { data: incremented, error: incrementError } = await supabase
      .rpc('increment_comment_likes', { comment_id: id });

    if (incrementError) {
      const message = incrementError.message || 'Failed to like comment';
      const hint = incrementError.hint || null;
      const code = incrementError.code || null;

      console.error('Error liking comment (rpc):', {
        code,
        message,
        hint,
        details: incrementError.details,
      });

      if (code === 'PGRST202' || code === '42883') {
        return NextResponse.json(
          {
            error: 'Like function is missing in database',
            code,
            message,
            hint,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to like comment',
          code,
          message,
          hint,
        },
        { status: 500 },
      );
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
