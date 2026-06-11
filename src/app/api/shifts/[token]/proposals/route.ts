import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { generateProposals } from '@/lib/algorithm'

export const dynamic = 'force-dynamic'

type Params = { params: { token: string } }

export async function POST(_req: Request, { params }: Params) {
  try {
    const db = await getDB()
    const shiftRes = await db.execute({
      sql: 'SELECT * FROM shifts WHERE token = ?',
      args: [params.token],
    })
    const shift = shiftRes.rows[0]
    if (!shift) return NextResponse.json({ error: '編集権限がありません' }, { status: 403 })

    const slotsRes = await db.execute({
      sql: 'SELECT * FROM slots WHERE shift_id = ? ORDER BY date, time_range',
      args: [shift.id],
    })
    const slots = slotsRes.rows

    const participantsRes = await db.execute({
      sql: 'SELECT * FROM participants WHERE shift_id = ?',
      args: [shift.id],
    })
    const participants = participantsRes.rows

    let availabilities: any[] = []
    if (slots.length > 0) {
      const ph = slots.map(() => '?').join(',')
      const avRes = await db.execute({
        sql: `SELECT * FROM availabilities WHERE slot_id IN (${ph})`,
        args: slots.map(s => s.id),
      })
      availabilities = avRes.rows
    }

    const proposalInput = {
      slots: slots.map(s => ({
        id: Number(s.id),
        date: s.date as string,
        timeRange: s.time_range as string,
        requiredCount: Number(s.required_count),
      })),
      participants: participants.map(p => ({
        id: Number(p.id),
        name: p.name as string,
        availabilities: availabilities
          .filter(a => a.participant_id === p.id)
          .reduce((acc: Record<string, string>, a) => {
            acc[String(a.slot_id)] = a.status as string
            return acc
          }, {}),
      })),
    }

    const proposals = generateProposals(proposalInput)

    await db.execute({ sql: 'DELETE FROM proposals WHERE shift_id = ?', args: [shift.id] })
    for (const proposal of proposals) {
      await db.execute({
        sql: 'INSERT INTO proposals (shift_id, proposal_json) VALUES (?, ?)',
        args: [shift.id, JSON.stringify(proposal)],
      })
    }

    return NextResponse.json({ proposals })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
