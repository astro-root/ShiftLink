import { NextRequest, NextResponse } from 'next/server';
import { getClient, initDB } from '@/lib/db';

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await initDB();
  const db = getClient();
  const result = await db.execute(`
    SELECT s.id, s.token, s.view_token, s.title, s.created_at,
      (SELECT COUNT(*) FROM participants p WHERE p.shift_id = s.id) AS participant_count,
      (SELECT COUNT(*) FROM slots sl WHERE sl.shift_id = s.id) AS slot_count
    FROM shifts s ORDER BY s.created_at DESC
  `);
  return NextResponse.json({ shifts: result.rows });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await initDB();
  const db = getClient();
  await db.execute({ sql: 'DELETE FROM availabilities WHERE participant_id IN (SELECT id FROM participants WHERE shift_id = ?)', args: [id] });
  await db.execute({ sql: 'DELETE FROM participants WHERE shift_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM slots WHERE shift_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM proposals WHERE shift_id = ?', args: [id] });
  await db.execute({ sql: 'DELETE FROM shifts WHERE id = ?', args: [id] });
  return NextResponse.json({ ok: true });
}
