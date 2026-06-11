'use client';
import { useState } from 'react';
import type { SSlot, PrefStatus } from './types';
import { fmtDate, PREF_BTN } from './utils';

interface Props {
  shiftTitle: string;
  slots: SSlot[];
  token: string;
  flash: (m: string) => void;
}

export default function ParticipantView({ shiftTitle, slots, token, flash }: Props) {
  const [partName, setPartName]     = useState('');
  const [partNote, setPartNote]     = useState('');
  const [partPrefs, setPartPrefs]   = useState<Map<number, PrefStatus>>(new Map());
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitJoin = async () => {
    if (!partName.trim()) { flash('⚠️ 名前を入力してください'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/shifts/${token}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: partName.trim(),
          note: partNote.trim(),
          preferences: slots.map(sl => ({ slotId: sl.id, status: partPrefs.get(sl.id) ?? 'available' })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSubmitted(true);
    } catch (e: unknown) {
      flash(`❌ ${e instanceof Error ? e.message : '送信に失敗しました'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg shadow-emerald-200">✅</div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-2">送信しました！</h2>
        <p className="text-slate-500"><span className="font-bold text-indigo-600">{partName}</span> さんの希望を受け付けました。</p>
        <p className="text-slate-400 text-sm mt-1.5">管理者がシフトを確定するまでお待ちください。</p>
      </div>
      <button
        onClick={() => { setSubmitted(false); setPartPrefs(new Map()); setPartName(''); setPartNote(''); }}
        className="text-sm text-indigo-500 hover:text-indigo-700 border border-indigo-200 rounded-xl px-5 py-2.5 hover:bg-indigo-50 transition font-medium"
      >✏️ 内容を修正して再送信</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">シフト希望入力</p>
          <h1 className="text-2xl font-black">{shiftTitle}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-7 space-y-3 sm:space-y-4">
        {slots.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-3">🗓️</div>
            <p className="font-semibold text-slate-600">まだ日程が設定されていません</p>
            <p className="text-sm text-slate-400 mt-1">管理者にお問い合わせください。</p>
          </div>
        ) : (<>
          <div className="card p-5">
            <label className="block text-sm font-bold text-slate-700 mb-2.5">👤 あなたのお名前</label>
            <input value={partName} onChange={e => setPartName(e.target.value)} placeholder="例: 田中 太郎" className="input-base text-base" />
            <p className="text-xs text-slate-400 mt-1.5">※ 同じ名前で再送信すると希望が更新されます</p>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide px-1 pt-1">📅 各日程の出勤希望</p>
          {slots.map(slot => {
            const cur = partPrefs.get(slot.id) ?? 'available';
            return (
              <div key={slot.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-black text-slate-900 text-base">{fmtDate(slot.date)}</p>
                    <p className="text-sm text-slate-400 font-medium">{slot.startTime} 〜 {slot.endTime}</p>
                  </div>
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full">
                    {slot.requiredCount}名必要
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['preferred', 'available', 'unavailable'] as PrefStatus[]).map(status => (
                    <button key={status} onClick={() => setPartPrefs(p => new Map(p).set(slot.id, status))}
                      className={`py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${cur === status ? PREF_BTN[status].active : PREF_BTN[status].inactive}`}>
                      {PREF_BTN[status].label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="card p-5">
            <label className="block text-sm font-bold text-slate-700 mb-2.5">📝 備考（任意）</label>
            <textarea value={partNote} onChange={e => setPartNote(e.target.value)}
              placeholder="例: 土曜は午後のみ可、交通費支給をお願いしたい など"
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder:text-slate-400 bg-white transition resize-none text-sm" />
          </div>
          <button onClick={submitJoin} disabled={submitting || !partName.trim()} className="btn-primary w-full py-4 text-base text-lg font-black rounded-2xl">
            {submitting ? '送信中…' : '✈️  希望を送信する'}
          </button>
        </>)}
      </main>
    </div>
  );
}
