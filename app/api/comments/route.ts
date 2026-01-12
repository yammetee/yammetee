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
    const { author, content, isAnonymous } = await request.json();
    if (!content || typeof isAnonymous !== 'boolean') {
      return NextResponse.json({ error: 'Content and isAnonymous are required' }, { status: 400 });
    }

    const fileContents = fs.readFileSync(commentsFilePath, 'utf8');
    const comments: Comment[] = JSON.parse(fileContents);

    const existingComment = comments.find(c => c.author === author && !c.isAnonymous);
    if (existingComment && !isAnonymous) {
      return NextResponse.json({ error: 'You can only leave one comment' }, { status: 409 });
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      author: isAnonymous ? 'Anonymous' : author,
      content,
      createdAt: new Date().toISOString(),
      isAnonymous,
      avatar: isAnonymous ? undefined : `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`,
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