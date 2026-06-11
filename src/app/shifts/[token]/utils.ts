import type { PrefStatus, Proposal } from './types';

export const DAY = ['日', '月', '火', '水', '木', '金', '土'];

export const fmtDate = (d: string) => {
  if (!d) return '';
  try {
    const t = new Date(d + 'T00:00:00');
    return `${t.getMonth() + 1}/${t.getDate()}(${DAY[t.getDay()]})`;
  } catch { return d; }
};

export const PREF_BTN: Record<PrefStatus, { label: string; active: string; inactive: string }> = {
  preferred:   { label: '◎ 希望する', active: 'bg-emerald-500 text-white shadow-md shadow-emerald-200',  inactive: 'bg-white text-slate-400 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200' },
  available:   { label: '○ 出勤可',   active: 'bg-sky-500 text-white shadow-md shadow-sky-200',           inactive: 'bg-white text-slate-400 border border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200' },
  unavailable: { label: '✗ 出勤不可', active: 'bg-red-500 text-white shadow-md shadow-red-200',           inactive: 'bg-white text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200' },
};

export const PREF_BADGE: Record<PrefStatus, string> = {
  preferred:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
  available:   'bg-slate-50 text-slate-500 border border-slate-100',
  unavailable: 'bg-red-50 text-red-600 border border-red-100',
};

export const AVATAR_COLORS = [
  'from-indigo-400 to-blue-500', 'from-violet-400 to-purple-500', 'from-pink-400 to-rose-500',
  'from-emerald-400 to-teal-500', 'from-amber-400 to-orange-500', 'from-cyan-400 to-sky-500',
];

export function buildExportHtml(title: string, prop: Proposal): string {
  const rows = prop.data.assignments.map((a, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
      <td style="padding:8px 14px;border:1px solid #e2e8f0;">${fmtDate(a.slotDate)}</td>
      <td style="padding:8px 14px;border:1px solid #e2e8f0;">${a.slotStart}〜${a.slotEnd}</td>
      <td style="padding:8px 14px;border:1px solid #e2e8f0;text-align:center;">${a.requiredCount}人</td>
      <td style="padding:8px 14px;border:1px solid #e2e8f0;color:${a.assigned.length < a.requiredCount ? '#e53e3e' : '#1a202c'};">
        ${a.assigned.map(s => s.name).join('、') || '（未割当）'}
      </td>
    </tr>`).join('');
  return `<div style="font-family:sans-serif;padding:28px;min-width:680px;background:#fff;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;">${title}</h1>
    <p style="font-size:13px;color:#64748b;margin:0 0 20px;">${prop.title} ｜ 希望適合率 ${prop.score}% ／ 充足率 ${prop.coverageRate}%</p>
    <table style="border-collapse:collapse;width:100%;font-size:13px;">
      <thead><tr style="background:#4f46e5;color:#fff;">
        <th style="padding:10px 14px;text-align:left;">日程</th>
        <th style="padding:10px 14px;text-align:left;">時間帯</th>
        <th style="padding:10px 14px;text-align:center;">必要</th>
        <th style="padding:10px 14px;text-align:left;">担当</th>
      </tr></thead><tbody>${rows}</tbody>
    </table>
    <p style="font-size:11px;color:#94a3b8;margin-top:16px;">出力日: ${new Date().toLocaleDateString('ja-JP')} ｜ ShiftLink</p>
  </div>`;
}
