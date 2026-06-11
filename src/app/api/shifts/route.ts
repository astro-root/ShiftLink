import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDB } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { title } = await req.json()
    if (!title?.trim()) {
      return NextResponse.json({ error: 'タイトルを入力してください' }, { status: 400 })
    }
    const db = await getDB()
    const token = randomUUID()
    const viewToken = randomUUID()
    await db.execute({
      sql: 'INSERT INTO shifts (token, view_token, title) VALUES (?, ?, ?)',
      args: [token, viewToken, title.trim()],
    })
    return NextResponse.json({ token, viewToken })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
