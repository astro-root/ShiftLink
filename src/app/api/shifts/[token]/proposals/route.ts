import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateProposals } from '@/lib/algorithm';

type Ctx = { params: { token: string } };

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const db = getDb();
    const shift = db.prepare('SELECT id FROM shifts WHERE edit_token = ?').get(params.token);
    if (!shift) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const staffRows = db.prepare('SELECT id, name FROM staff WHERE shift_id = ?').all(shift.id);
    const slotRows  = db.prepare(
      'SELECT * FROM slots WHERE shift_id = ? ORDER BY date, start_time'
    ).all(shift.id);
    const prefRows  = db.prepare(
      'SELECT p.staff_id, p.slot_id, p.status FROM preferences p JOIN staff s ON s.id = p.staff_id WHERE s.shift_id = ?'
    ).all(shift.id);

    if (!staffRows.length || !slotRows.length) {
      return NextResponse.json(
        { error: 'スタッフと時間帯を先に登録して保存してください' },
        { status: 400 }
      );
    }

    const proposals = generateProposals(
      slotRows.map((s: any) => ({
        id: s.id, date: s.date,
        startTime: s.start_time, endTime: s.end_time, requiredCount: s.required_count,
      })),
      staffRows.map((s: any) => ({ id: s.id, name: s.name })),
      prefRows.map((p: any) => ({
        staffId: p.staff_id, slotId: p.slot_id,
        status: p.status as 'preferred' | 'available' | 'unavailable',
      }))
    );

    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM proposals WHERE shift_id = ?').run(shift.id);
      for (const p of proposals) {
        db.prepare(
          'INSERT INTO proposals (shift_id, title, score, coverage_rate, data) VALUES (?, ?, ?, ?, ?)'
        ).run(shift.id, p.title, p.score, p.coverageRate, JSON.stringify({ assignments: p.assignments }));
      }
      db.exec('COMMIT');
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch { /* ignore */ }
      throw e;
    }

    const saved = db.prepare('SELECT * FROM proposals WHERE shift_id = ? ORDER BY id').all(shift.id);
    return NextResponse.json({
      proposals: saved.map((p: any) => ({
        id: p.id, title: p.title, score: p.score, coverageRate: p.coverage_rate,
        data: JSON.parse(p.data),
      })),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
