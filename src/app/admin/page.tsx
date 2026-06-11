'use client';
import { useState } from 'react';

interface ShiftRow {
  id: number; token: string; view_token: string; title: string;
  created_at: string; participant_count: number; slot_count: number;
}

export default function AdminPage() {
  const [pw, setPw]           = useState('');
  const [authed, setAuthed]   = useState(false);
  const [shifts, setShifts]   = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const [msg, setMsg]         = useState('');

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const login = async () => {
    setLoading(true); setErr('');
    try {
      const res = await fetch('/api/admin/shifts', {
        headers: { 'x-admin-password': pw }
      });
      if (res.ok) {
        const d = await res.json();
        setShifts(d.shifts); setAuthed(true);
      } else {
        setErr('パスワードが違います');
      }
    } catch {
      setErr('接続に失敗しました');
    }
    setLoading(false);
  };

  const reload = async () => {
    const res = await fetch('/api/admin/shifts', { headers: { 'x-admin-password': pw } });
    const d = await res.json();
    setShifts(d.shifts);
  };

  const del = async (id: number, title: string) => {
    if (!confirm(`「${title}」を完全に削除しますか？`)) return;
    const res = await fetch('/api/admin/shifts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { flash('✅ 削除しました'); reload(); }
    else flash('❌ 削除に失敗しました');
  };

  if (!authed) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <h1 className="text-white font-black text-xl mb-1">🔐 Admin</h1>
        <p className="text-slate-400 text-sm mb-6">ShiftLink 開発者管理画面</p>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="パスワード"
          className="w-full bg-slate-700 text-white border border-slate-600 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"/>
        {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
        <button onClick={login} disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-3 transition disabled:opacity-50">
          {loading ? '認証中…' : 'ログイン'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6">
      {msg && <div className="fixed top-4 right-4 bg-slate-700 text-white px-4 py-2 rounded-xl text-sm z-50">{msg}</div>}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-black text-2xl">🔐 Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-0.5">全シフト — {shifts.length}件</p>
          </div>
          <button onClick={reload}
            className="text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl px-4 py-2 transition">
            🔄 更新
          </button>
        </div>
        <div className="space-y-3">
          {shifts.map(s => (
            <div key={s.id} className="bg-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg truncate">{s.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {new Date(s.created_at).toLocaleString('ja-JP')} · 参加者 {s.participant_count}人 · スロット {s.slot_count}件
                </p>
                <p className="text-slate-600 text-xs mt-1 font-mono truncate">{s.token}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={`/shifts/${s.token}`} target="_blank"
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition font-semibold">
                  管理画面 →
                </a>
                <button onClick={() => del(s.id, s.title)}
                  className="text-xs bg-red-900 hover:bg-red-700 text-red-300 px-3 py-2 rounded-lg transition font-semibold">
                  削除
                </button>
              </div>
            </div>
          ))}
          {shifts.length === 0 && (
            <div className="text-center py-20 text-slate-500">シフトがまだありません</div>
          )}
        </div>
      </div>
    </div>
  );
}
