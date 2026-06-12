'use client';
import type { SSlot, SStaff, SPref, PrefStatus } from '../types';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { RefreshCw, Lightbulb } from 'lucide-react';
import { fmtDate, PREF_BADGE, AVATAR_COLORS } from '../utils';

interface Props {
  staff: SStaff[];
  slots: SSlot[];
  prefs: SPref[];
  generating: boolean;
  token: string;
  onLoadData: () => void;
  onGenProposals: () => void;
  onDeleteStaff: (id: number) => void;
  flash: (m: string) => void;
}

export default function Tab1Participants({
  staff, slots, prefs, generating, onLoadData, onGenProposals, onDeleteStaff,
}: Props) {
  const getStaffPref = (sid: number, slid: number): PrefStatus =>
    prefs.find(p => p.staffId === sid && p.slotId === slid)?.status ?? 'available';

  return (<>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
      <div>
        <h2 className="font-black text-slate-900 text-lg">{staff.length}名が回答済み</h2>
        <p className="text-sm text-slate-400 mt-0.5">参加リンクをシェアして希望を収集してください</p>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <button onClick={onLoadData} className="btn-secondary text-sm py-2.5 px-4 flex items-center justify-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> 更新
        </button>
        <button onClick={onGenProposals} disabled={generating || staff.length === 0}
          className="btn-primary text-sm py-2.5 flex items-center justify-center gap-1.5 flex-1 sm:flex-none">
          {generating ? '生成中…' : (<><Lightbulb className="w-3.5 h-3.5" /> 候補案を生成</>)}
        </button>
      </div>
    </div>
    {staff.length === 0 ? (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">👥</div>
        <p className="font-bold text-slate-600 mb-1">まだ参加者がいません</p>
        <p className="text-sm text-slate-400">「共有・出力」タブから参加リンクをシェアしてください</p>
      </div>
    ) : (
      <div className="space-y-3">
        {staff.map((s, si) => (
          <div key={s.id} className="card p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[si % AVATAR_COLORS.length]} flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0`}>
                {s.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 truncate">{s.name}</p>
                <p className="text-xs text-slate-400">{slots.length}件の日程{s.note ? ' ・ 備考あり' : ''}</p>
              </div>
              <button onClick={() => onDeleteStaff(s.id)}
                className="text-xs text-slate-300 hover:text-red-500 border border-slate-100 hover:border-red-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-semibold shrink-0">
                削除
              </button>
            </div>
            {s.note && (
              <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
                📝 {s.note}
              </p>
            )}
            {slots.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {slots.map(sl => {
                  const st = getStaffPref(s.id, sl.id);
                  return (
                    <span key={sl.id} className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${PREF_BADGE[st]}`}>
                      {st === 'preferred' ? '◎' : st === 'unavailable' ? '✗' : '○'} {fmtDate(sl.date)} {sl.startTime}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </>);
}
