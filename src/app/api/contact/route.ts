import { NextRequest, NextResponse } from 'next/server';
import { getClient, initDB } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();
    if (!email?.trim() || !message?.trim())
      return NextResponse.json({ error: 'メールアドレスとお問い合わせ内容は必須です' }, { status: 400 });
    await initDB();
    const db = getClient();
    await db.execute({
      sql: 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
      args: [name?.trim() ?? '', email.trim(), message.trim()],
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-password') !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDB();
  const db = getClient();
  const result = await db.execute('SELECT * FROM contacts ORDER BY created_at DESC');
  return NextResponse.json({ contacts: result.rows });
}
