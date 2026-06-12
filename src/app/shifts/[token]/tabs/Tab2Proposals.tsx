'use client';
import type { Proposal, PSlot } from '../types';
import { RefreshCw } from 'lucide-react';

interface Props {
  proposals: Proposal[];
  selProp: number;
  generating: boolean;
  onSelect: (pi: number) => void;
  onGenProposals: () => void;
  onShowDetail: (pi: number) => void;
}

export default function Tab2Proposals({
  proposals, selProp, generating, onSelect, onGenProposals, onShowDetail,
}: Props) {
  const seen = new Set<string>();
  const unique = (proposals as Proposal[]).reduce((acc: { prop: Proposal; pi: number }[], prop: Proposal, pi: number) => {
    const key = (prop.data?.assignments ?? []).map((a: PSlot) =>
      `${a.slotId}:${[...a.assigned].sort((x, y) => x.staffId - y.staffId).map(s => s.staffId).join(',')}`
    ).join('|');
    if (!seen.has(key)) { seen.add(key); acc.push({ prop, pi }); }
    return acc;
  }, []);

  return (<>
    <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-sm text-slate-500 flex-1">参加者の希望をもとに3種類の最適案を生成します。カードをクリックして選択し、出力タブから保存できます。</p>
      <button onClick={onGenProposals} disabled={generating}
        className="btn-primary text-sm py-2.5 whitespace-nowrap shrink-0">
        {generating ? '生成中…' : (<><RefreshCw className="w-3.5 h-3.5" /> 候補案を生成</>)}
      </button>
    </div>
    {proposals.length === 0 ? (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">📋</div>
        <p className="font-bold text-slate-600 mb-1">候補案がまだありません</p>
        <p className="text-sm text-slate-400">参加者の希望が集まったら「候補案を生成」してください</p>
      </div>
    ) : (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {unique.map(({ prop, pi }) => (
          <div key={prop.id} onClick={() => onSelect(pi)}
            className={`card p-5 cursor-pointer transition-all border-2 ${selProp === pi ? 'border-indigo-500 shadow-lg shadow-indigo-100/60 ring-2 ring-indigo-100' : 'border-transparent card-hover'}`}>
            <div className="flex items-start justify-between mb-3 gap-2">
              <h3 className="font-black text-slate-900">{prop.title}</h3>
              {selProp === pi && <span className="badge bg-indigo-100 text-indigo-700 shrink-0">選択中 ✓</span>}
            </div>
            <div className="space-y-2 mb-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">希望適合率</span>
                  <span className="font-black text-emerald-600">{prop.score}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all" style={{ width: `${prop.score}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">充足率</span>
                  <span className={`font-black ${prop.coverageRate < 100 ? 'text-red-500' : 'text-indigo-600'}`}>{prop.coverageRate}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${prop.coverageRate < 100 ? 'bg-gradient-to-r from-red-400 to-orange-400' : 'bg-gradient-to-r from-indigo-400 to-violet-400'}`}
                    style={{ width: `${prop.coverageRate}%` }} />
                </div>
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); onShowDetail(pi); }}
              className="w-full text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg py-2 font-semibold transition mt-1">
              詳細を見る →
            </button>
          </div>
        ))}
      </div>
    )}
  </>);
}
