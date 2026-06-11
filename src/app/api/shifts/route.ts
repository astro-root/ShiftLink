import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    const db = getDb();
    const editToken = uuidv4();
    const viewToken = uuidv4();
    db.prepare('INSERT INTO shifts (title, edit_token, view_token) VALUES (?, ?, ?)')
      .run(title ?? 'シフト', editToken, viewToken);
    return NextResponse.json({ editToken, viewToken });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
