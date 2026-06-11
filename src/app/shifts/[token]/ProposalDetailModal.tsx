'use client';
import type { PSlot, Proposal } from './types';
import { fmtDate } from './utils';

interface Props {
  proposal: Proposal;
  onClose: () => void;
}

export default function ProposalDetailModal({ proposal, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="font-black text-slate-900">{proposal.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              希望適合率 {proposal.score}% ／ 充足率 {proposal.coverageRate}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition font-bold text-xl"
          >×</button>
        </div>
        <div className="p-5 space-y-2">
          {(proposal.data?.assignments ?? []).map((a: PSlot, ai: number) => (
            <div
              key={ai}
              className={`flex items-start gap-3 p-3 rounded-xl ${a.assigned.length < a.requiredCount ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}
            >
              <div className="shrink-0 min-w-[80px]">
                <p className="font-bold text-slate-700 text-sm">{fmtDate(a.slotDate)}</p>
                <p className="text-xs text-slate-400">{a.slotStart}〜{a.slotEnd}</p>
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${a.assigned.length > 0 ? 'text-slate-800' : 'text-red-500'}`}>
                  {a.assigned.length > 0 ? a.assigned.map(s => s.name).join('、') : '未割当'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {a.assigned.length}/{a.requiredCount}名
                  {a.assigned.length < a.requiredCount && (
                    <span className="text-red-400 ml-1">（{a.requiredCount - a.assigned.length}名不足）</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
