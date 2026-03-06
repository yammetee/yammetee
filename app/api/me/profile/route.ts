import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { NextRequest } from 'next/server';

const ADMIN_EMAIL = 'a.luganko@gmail.com';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profileResult, commentResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('first_name, last_name, nickname')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('comments')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      throw profileResult.error;
    }
    if (commentResult.error) {
      throw commentResult.error;
    }

    const userProfile = profileResult.data;
    const userCommentId = commentResult.data?.id ?? null;

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      isAdmin: (user.email || '').toLowerCase() === ADMIN_EMAIL,
      createdAt: user.created_at,
      userCommentId,
      firstName: userProfile?.first_name || '',
      lastName: userProfile?.last_name || '',
      nickname: userProfile?.nickname || '',
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

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          nickname,
        },
        { onConflict: 'user_id' },
      )
      .select('first_name, last_name, nickname')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      nickname: data.nickname || '',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
