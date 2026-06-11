import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Params = { params: { token: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const db = await getDB()
    const res = await db.execute({
      sql: 'SELECT * FROM shifts WHERE token = ? OR view_token = ?',
      args: [params.token, params.token],
    })
    const shift = res.rows[0]
    if (!shift) return NextResponse.json({ error: 'シフトが見つかりません' }, { status: 404 })

    const isViewOnly = shift.view_token === params.token && shift.token !== params.token

    const slotsRes = await db.execute({
      sql: 'SELECT * FROM slots WHERE shift_id = ? ORDER BY date, time_range',
      args: [shift.id],
    })
    const participantsRes = await db.execute({
      sql: 'SELECT * FROM participants WHERE shift_id = ? ORDER BY created_at',
      args: [shift.id],
    })
    const proposalsRes = await db.execute({
      sql: 'SELECT * FROM proposals WHERE shift_id = ? ORDER BY created_at DESC',
      args: [shift.id],
    })

    const slots = slotsRes.rows
    let availabilities: any[] = []
    if (slots.length > 0) {
      const ph = slots.map(() => '?').join(',')
      const avRes = await db.execute({
        sql: `SELECT * FROM availabilities WHERE slot_id IN (${ph})`,
        args: slots.map(s => s.id),
      })
      availabilities = avRes.rows
    }

    const participants = participantsRes.rows.map(p => ({
      id: p.id,
      name: p.name,
      note: p.note ?? '',
      createdAt: p.created_at,
      availabilities: availabilities
        .filter(a => a.participant_id === p.id)
        .reduce((acc: Record<string, string>, a) => {
          acc[String(a.slot_id)] = a.status as string
          return acc
        }, {}),
    }))

    return NextResponse.json({
      id: shift.id,
      token: isViewOnly ? null : shift.token,
      viewToken: shift.view_token,
      title: shift.title,
      isViewOnly,
      isEditor: !isViewOnly,
      slots: slots.map(s => ({
        id: s.id,
        date: s.date,
        timeRange: s.time_range,
        requiredCount: s.required_count,
      })),
      participants,
      proposals: proposalsRes.rows.map(p => ({
        id: p.id,
        data: JSON.parse(p.proposal_json as string),
        createdAt: p.created_at,
      })),
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const db = await getDB()
    const res = await db.execute({
      sql: 'SELECT * FROM shifts WHERE token = ?',
      args: [params.token],
    })
    const shift = res.rows[0]
    if (!shift) return NextResponse.json({ error: '編集権限がありません' }, { status: 403 })

    const { title, slots } = await req.json()
    if (title !== undefined) {
      await db.execute({
        sql: "UPDATE shifts SET title = ?, updated_at = datetime('now') WHERE id = ?",
        args: [title.trim(), shift.id],
      })
    }
    if (Array.isArray(slots)) {
      await db.execute({ sql: 'DELETE FROM slots WHERE shift_id = ?', args: [shift.id] })
      for (const slot of slots) {
        await db.execute({
          sql: 'INSERT INTO slots (shift_id, date, time_range, required_count) VALUES (?, ?, ?, ?)',
          args: [shift.id, slot.date, slot.timeRange, slot.requiredCount ?? 1],
        })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const db = await getDB()
    const res = await db.execute({
      sql: 'SELECT * FROM shifts WHERE token = ?',
      args: [params.token],
    })
    const shift = res.rows[0]
    if (!shift) return NextResponse.json({ error: '編集権限がありません' }, { status: 403 })

    const { action } = await req.json()
    if (action === 'regenerate_view_token') {
      const newViewToken = randomUUID()
      await db.execute({
        sql: 'UPDATE shifts SET view_token = ? WHERE id = ?',
        args: [newViewToken, shift.id],
      })
      return NextResponse.json({ viewToken: newViewToken })
    }
    return NextResponse.json({ error: '不明なアクション' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
