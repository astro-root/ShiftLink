import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type Ctx = { params: { token: string } };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const db = getDb();
    const shift = db.prepare(
      'SELECT * FROM shifts WHERE edit_token = ? OR view_token = ?'
    ).get(params.token, params.token) as any;
    if (!shift) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { name, preferences } = await req.json() as {
      name: string;
      preferences: { slotId: number; status: string }[];
    };
    if (!name?.trim()) return NextResponse.json({ error: '名前を入力してください' }, { status: 400 });

    const existing = db.prepare(
      'SELECT id FROM staff WHERE shift_id = ? AND name = ?'
    ).get(shift.id, name.trim()) as any;

    let staffId: number;
    if (existing) {
      staffId = existing.id;
      db.prepare('DELETE FROM preferences WHERE staff_id = ?').run(staffId);
    } else {
      staffId = Number(
        db.prepare('INSERT INTO staff (shift_id, name) VALUES (?, ?)').run(shift.id, name.trim()).lastInsertRowid
      );
    }

    for (const p of preferences) {
      if (p.status !== 'available') {
        db.prepare('INSERT OR IGNORE INTO preferences (staff_id, slot_id, status) VALUES (?, ?, ?)')
          .run(staffId, p.slotId, p.status);
      }
    }

    return NextResponse.json({ ok: true, staffId });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const db = getDb();
    const shift = db.prepare('SELECT id FROM shifts WHERE edit_token = ?').get(params.token) as any;
    if (!shift) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const staffId = Number(new URL(req.url).searchParams.get('staffId'));
    if (!staffId) return NextResponse.json({ error: 'staffId required' }, { status: 400 });

    const staff = db.prepare('SELECT id FROM staff WHERE id = ? AND shift_id = ?').get(staffId, shift.id) as any;
    if (!staff) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    db.prepare('DELETE FROM staff WHERE id = ?').run(staffId);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
