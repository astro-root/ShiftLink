'use client';
import type { Proposal } from '../types';
import { buildExportHtml } from '../utils';

interface Props {
  token: string;
  viewToken: string;
  shiftTitle: string;
  proposals: Proposal[];
  selProp: number;
  setSelProp: (v: number) => void;
  flash: (m: string) => void;
}

export default function Tab3Share({
  token, viewToken, shiftTitle, proposals, selProp, setSelProp, flash,
}: Props) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';

  const copyLink = async (url: string) => {
    try { await navigator.clipboard.writeText(url); flash('✅ コピーしました'); }
    catch { flash('❌ コピーに失敗しました'); }
  };

  const regenToken = async () => {
    try {
      const res = await fetch(`/api/shifts/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate_view_token' }),
      });
      const d = await res.json();
      flash('✅ 参加リンクを再発行しました');
      // viewToken の更新は親側で再fetchが必要な場合はコールバックを追加
      void d;
    } catch { flash('❌ 再発行に失敗しました'); }
  };

  const withTmp = async (html: string, cb: (el: HTMLElement) => Promise<void>) => {
    const w = document.createElement('div');
    w.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;pointer-events:none;';
    w.innerHTML = html;
    document.body.appendChild(w);
    try { await cb(w.firstElementChild as HTMLElement); }
    finally { document.body.removeChild(w); }
  };

  const exportImage = async () => {
    const p = proposals[selProp]; if (!p) { flash('❌ 候補案を選択'); return; }
    try {
      const { default: h2c } = await import('html2canvas');
      await withTmp(buildExportHtml(shiftTitle, p), async el => {
        const c = await h2c(el, { scale: 2, useCORS: true, backgroundColor: '#fff' });
        const a = document.createElement('a'); a.download = `${shiftTitle}.png`; a.href = c.toDataURL('image/png'); a.click();
      });
      flash('✅ 画像を保存しました');
    } catch { flash('❌ 画像出力に失敗しました'); }
  };

  const exportPDF = async () => {
    const p = proposals[selProp]; if (!p) { flash('❌ 候補案を選択'); return; }
    try {
      const { default: h2c } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      await withTmp(buildExportHtml(shiftTitle, p), async el => {
        const c = await h2c(el, { scale: 2, useCORS: true, backgroundColor: '#fff' });
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pw = pdf.internal.pageSize.getWidth();
        pdf.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, pw, Math.min((c.height * pw) / c.width, pdf.internal.pageSize.getHeight()));
        pdf.save(`${shiftTitle}.pdf`);
      });
      flash('✅ PDFを保存しました');
    } catch { flash('❌ PDF出力に失敗しました'); }
  };

  return (<>
    <div className="card p-5">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">🔗 リンクの共有</h3>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-100">参加リンク</span>
            <span className="text-xs text-slate-400">スタッフに送るリンク</span>
          </div>
          <div className="flex gap-2">
            <input readOnly value={`${base}/shifts/${viewToken}`} className="flex-1 input-base text-xs sm:text-sm bg-slate-50 min-w-0 cursor-text text-slate-600 font-mono" />
            <button onClick={() => copyLink(`${base}/shifts/${viewToken}`)} className="btn-secondary text-sm py-2 px-4 shrink-0">コピー</button>
          </div>
          <button onClick={regenToken} className="mt-1.5 text-xs text-red-400 hover:text-red-600 underline">
            参加リンクを再発行（現在のリンクは無効になります）
          </button>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">管理リンク</span>
            <span className="text-xs text-slate-400">このページのURL</span>
          </div>
          <div className="flex gap-2">
            <input readOnly value={`${base}/shifts/${token}`} className="flex-1 input-base text-xs sm:text-sm bg-slate-50 min-w-0 cursor-text text-slate-600 font-mono" />
            <button onClick={() => copyLink(`${base}/shifts/${token}`)} className="btn-secondary text-sm py-2 px-4 shrink-0">コピー</button>
          </div>
        </div>
      </div>
    </div>
    <div className="card p-5">
      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">📥 シフト表の出力</h3>
      {proposals.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-slate-400">先に「候補案」タブで候補案を生成してください</p>
        </div>
      ) : (<>
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-600 mb-2 block">出力する候補案</label>
          <select value={selProp} onChange={e => setSelProp(Number(e.target.value))} className="input-base text-sm">
            {proposals.map((p, i) => (
              <option key={p.id} value={i}>{p.title}（希望適合 {p.score}% ／ 充足率 {p.coverageRate}%）</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={exportImage} className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all text-sm">🖼️ 画像で保存</button>
          <button onClick={exportPDF} className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all text-sm">📄 PDFで保存</button>
        </div>
      </>)}
    </div>
  </>);
}
