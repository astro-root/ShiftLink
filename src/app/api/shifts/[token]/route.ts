import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';

type Ctx = { params: { token: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const db = getDb();
    const shift = db.prepare(
      'SELECT * FROM shifts WHERE edit_token = ? OR view_token = ?'
    ).get(params.token, params.token) as any;
    if (!shift) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isEditor = shift.edit_token === params.token;
    const staff    = db.prepare('SELECT id, name FROM staff WHERE shift_id = ?').all(shift.id) as any[];
    const slots    = db.prepare('SELECT * FROM slots WHERE shift_id = ? ORDER BY date, start_time').all(shift.id) as any[];
    const prefs    = db.prepare('SELECT p.staff_id, p.slot_id, p.status FROM preferences p JOIN staff s ON s.id = p.staff_id WHERE s.shift_id = ?').all(shift.id) as any[];
    const props    = db.prepare('SELECT * FROM proposals WHERE shift_id = ? ORDER BY id').all(shift.id) as any[];

    return NextResponse.json({
      isEditor,
      shift: { id: shift.id, title: shift.title, editToken: isEditor ? shift.edit_token : null, viewToken: isEditor ? shift.view_token : null },
      staff:       staff.map(s => ({ id: s.id, name: s.name })),
      slots:       slots.map(s => ({ id: s.id, date: s.date, startTime: s.start_time, endTime: s.end_time, requiredCount: s.required_count })),
      preferences: prefs.map(p => ({ staffId: p.staff_id, slotId: p.slot_id, status: p.status })),
      proposals:   props.map(p => ({ id: p.id, title: p.title, score: p.score, coverageRate: p.coverage_rate, data: JSON.parse(p.data) })),
    });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

// 管理者: タイトルと時間帯のみ更新 (参加者希望は join エンドポイントで管理)
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const db = getDb();
    const shift = db.prepare('SELECT id FROM shifts WHERE edit_token = ?').get(params.token) as any;
    if (!shift) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { title, slots } = await req.json() as {
      title: string;
      slots: { date: string; startTime: string; endTime: string; requiredCount: number }[];
    };

    db.exec('BEGIN');
    try {
      db.prepare('UPDATE shifts SET title = ? WHERE id = ?').run(title, shift.id);
      // スロット変更時は既存の参加者希望もリセット (CASCADE で自動削除)
      db.prepare('DELETE FROM slots WHERE shift_id = ?').run(shift.id);
      for (const sl of slots) {
        db.prepare('INSERT INTO slots (shift_id, date, start_time, end_time, required_count) VALUES (?, ?, ?, ?, ?)')
          .run(shift.id, sl.date, sl.startTime, sl.endTime, sl.requiredCount);
      }
      db.exec('COMMIT');
    } catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}

export async function PATCH(_req: NextRequest, { params }: Ctx) {
  try {
    const db = getDb();
    const shift = db.prepare('SELECT id FROM shifts WHERE edit_token = ?').get(params.token) as any;
    if (!shift) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const viewToken = uuidv4();
    db.prepare('UPDATE shifts SET view_token = ? WHERE id = ?').run(viewToken, shift.id);
    return NextResponse.json({ viewToken });
  } catch (e: unknown) { return NextResponse.json({ error: String(e) }, { status: 500 }); }
}
