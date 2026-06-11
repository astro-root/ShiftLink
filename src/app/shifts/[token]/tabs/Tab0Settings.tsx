'use client';
import { useState } from 'react';
import type { SSlot, EditSlot } from '../types';
import { fmtDate } from '../utils';

interface Props {
  token: string;
  shiftTitle: string;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editSlots: EditSlot[];
  setEditSlots: (fn: (p: EditSlot[]) => EditSlot[]) => void;
  setShiftTitle: (v: string) => void;
  flash: (m: string) => void;
}

export default function Tab0Settings({
  token, editTitle, setEditTitle, editSlots, setEditSlots, setShiftTitle, flash,
}: Props) {
  const [newSlot, setNewSlot] = useState<EditSlot>({ date: '', startTime: '09:00', endTime: '17:00', requiredCount: 1 });
  const [saving, setSaving]   = useState(false);

  const addSlot = () => {
    const { date, startTime, endTime, requiredCount } = newSlot;
    if (!date || !startTime || !endTime) { flash('⚠️ 日付と時間を入力してください'); return; }
    if (startTime >= endTime) { flash('⚠️ 終了時刻は開始より後にしてください'); return; }
    setEditSlots(p => [...p, { date, startTime, endTime, requiredCount }]);
    setNewSlot({ date: '', startTime: '09:00', endTime: '17:00', requiredCount: 1 });
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/shifts/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          slots: editSlots.map(s => ({ date: s.date, timeRange: s.startTime + '-' + s.endTime, requiredCount: s.requiredCount })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShiftTitle(editTitle);
      flash('✅ 保存しました');
    } catch (e: unknown) {
      flash(`❌ ${e instanceof Error ? e.message : '保存に失敗'}`);
    } finally {
      setSaving(false);
    }
  };

  return (<>
    <div className="card p-5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">シフト名</label>
      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="input-base" placeholder="シフト名を入力" />
    </div>
    <div className="card p-5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">時間帯の管理</label>
      {editSlots.length === 0 && <p className="text-sm text-slate-400 mb-3">時間帯が設定されていません</p>}
      <div className="space-y-2 mb-4">
        {editSlots.map((sl, i) => (
          <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 group">
            <span className="font-bold text-indigo-600 text-sm">{fmtDate(sl.date)}</span>
            <span className="text-slate-600 text-sm">{sl.startTime}〜{sl.endTime}</span>
            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">×{sl.requiredCount}人</span>
            <button onClick={() => setEditSlots(p => p.filter((_, j) => j !== i))}
              className="ml-auto text-slate-200 hover:text-red-500 text-xl leading-none font-black transition group-hover:text-slate-300">×</button>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">日付</label>
          <input type="date" value={newSlot.date} onChange={e => setNewSlot(p => ({ ...p, date: e.target.value }))}
            style={{ WebkitAppearance: 'none', appearance: 'none', height: '48px', lineHeight: '48px' }}
            className="w-full border border-slate-200 rounded-xl px-4 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">開始</label>
            <input type="time" value={newSlot.startTime} onChange={e => setNewSlot(p => ({ ...p, startTime: e.target.value }))}
              style={{ WebkitAppearance: 'none', appearance: 'none', height: '48px' }}
              className="w-full border border-slate-200 rounded-xl px-4 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">終了</label>
            <input type="time" value={newSlot.endTime} onChange={e => setNewSlot(p => ({ ...p, endTime: e.target.value }))}
              style={{ WebkitAppearance: 'none', appearance: 'none', height: '48px' }}
              className="w-full border border-slate-200 rounded-xl px-4 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">必要人数</label>
            <div className="flex items-center gap-2 w-full border border-slate-200 rounded-xl px-4 bg-white" style={{ height: '48px' }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newSlot.requiredCount}
                onChange={e => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  if (v === '') return;
                  const n = Math.min(99, Math.max(1, Number(v)));
                  setNewSlot(p => ({ ...p, requiredCount: n }));
                }}
                className="w-16 text-center bg-transparent outline-none font-bold text-indigo-600 text-base" />
              <span className="text-slate-400 text-sm">人</span>
            </div>
          </div>
          <div className="flex items-end">
            <button onClick={addSlot} className="btn-primary text-sm w-full" style={{ height: '48px' }}>＋ 追加</button>
          </div>
        </div>
      </div>
      {editSlots.length > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3 mt-3">
          ⚠️ 日程を変更すると既存の参加者の希望がリセットされます。
        </p>
      )}
    </div>
    <button onClick={saveSettings} disabled={saving} className="btn-primary w-full py-3.5">
      {saving ? '保存中…' : '💾 保存する'}
    </button>
  </>);
}
