import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const commentsFilePath = path.join(process.cwd(), 'app/data/comments.json');

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isAnonymous: boolean;
  avatar?: string;
  likes: number;
}

// PATCH /api/comments/[id]/like - лайк комментария
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const fileContents = fs.readFileSync(commentsFilePath, 'utf8');
    const comments: Comment[] = JSON.parse(fileContents);

    const commentIndex = comments.findIndex(c => c.id === id);
    if (commentIndex === -1) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    comments[commentIndex].likes += 1;
    fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));

    return NextResponse.json(comments[commentIndex]);
  } catch (error) {
    console.error('Error liking comment:', error);
    return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 });
  }
}