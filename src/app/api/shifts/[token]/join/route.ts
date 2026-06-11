import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Params = { params: { token: string } }

export async function POST(req: Request, { params }: Params) {
  try {
    const db = await getDB()
    const shiftRes = await db.execute({
      sql: 'SELECT * FROM shifts WHERE token = ? OR view_token = ?',
      args: [params.token, params.token],
    })
    const shift = shiftRes.rows[0]
    if (!shift) return NextResponse.json({ error: 'シフトが見つかりません' }, { status: 404 })

    const { name, note, availabilities } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: '名前を入力してください' }, { status: 400 })

    const existingRes = await db.execute({
      sql: 'SELECT id FROM participants WHERE shift_id = ? AND name = ?',
      args: [shift.id, name.trim()],
    })

    let participantId: number
    if (existingRes.rows.length > 0) {
      participantId = Number(existingRes.rows[0].id)
      await db.execute({
        sql: 'DELETE FROM availabilities WHERE participant_id = ?',
        args: [participantId],
      })
    } else {
      const insertRes = await db.execute({
        sql: 'INSERT INTO participants (shift_id, name, note) VALUES (?, ?, ?)',
        args: [shift.id, name.trim(), note?.trim() ?? ''],
      })
      participantId = Number(insertRes.lastInsertRowid)
    }

    if (Array.isArray(availabilities)) {
      for (const av of availabilities) {
        if (av.slotId && av.status) {
          await db.execute({
            sql: 'INSERT OR REPLACE INTO availabilities (participant_id, slot_id, status) VALUES (?, ?, ?)',
            args: [participantId, av.slotId, av.status],
          })
        }
      }
    }

    return NextResponse.json({ ok: true, participantId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const db = await getDB()
    const shiftRes = await db.execute({
      sql: 'SELECT * FROM shifts WHERE token = ?',
      args: [params.token],
    })
    const shift = shiftRes.rows[0]
    if (!shift) return NextResponse.json({ error: '編集権限がありません' }, { status: 403 })

    const { participantId } = await req.json()
    await db.execute({
      sql: 'DELETE FROM availabilities WHERE participant_id = ?',
      args: [participantId],
    })
    await db.execute({
      sql: 'DELETE FROM participants WHERE id = ? AND shift_id = ?',
      args: [participantId, shift.id],
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
