'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { SSlot, SStaff, SPref, Proposal, EditSlot } from './types';
import ParticipantView from './ParticipantView';
import ProposalDetailModal from './ProposalDetailModal';
import Tab0Settings from './tabs/Tab0Settings';
import Tab1Participants from './tabs/Tab1Participants';
import Tab2Proposals from './tabs/Tab2Proposals';
import Tab3Share from './tabs/Tab3Share';

export default function ShiftPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading]       = useState(true);
  const [pageErr, setPageErr]       = useState('');
  const [msg, setMsg]               = useState('');
  const [isEditor, setIsEditor]     = useState(false);
  const [activeTab, setActiveTab]   = useState(0);
  const [shiftTitle, setShiftTitle] = useState('');
  const [editTitle, setEditTitle]   = useState('');
  const [editSlots, setEditSlots]   = useState<EditSlot[]>([]);
  const [slots, setSlots]           = useState<SSlot[]>([]);
  const [staff, setStaff]           = useState<SStaff[]>([]);
  const [prefs, setPrefs]           = useState<SPref[]>([]);
  const [proposals, setProposals]   = useState<Proposal[]>([]);
  const [selProp, setSelProp]       = useState(0);
  const [viewToken, setViewToken]   = useState('');
  const [generating, setGenerating] = useState(false);
  const [propDetailIdx, setPropDetailIdx] = useState<number | null>(null);

  const flash = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3200); }, []);

  const loadData = useCallback(() => {
    fetch(`/api/shifts/${token}`)
      .then(async r => {
        if (r.status === 404) throw new Error('シフトが見つかりません。URLを確認してください。');
        if (!r.ok) throw new Error('読み込みに失敗しました');
        return r.json();
      })
      .then(d => {
        const s = (d.slots || []).map((sl: any) => {
          const [startTime = '', endTime = ''] = (sl.timeRange || '').split('-');
          return { ...sl, startTime, endTime };
        });
        setIsEditor(d.isEditor); setShiftTitle(d.title); setEditTitle(d.title);
        setSlots(s); setEditSlots(s.map((sl: SSlot) => ({ date: sl.date, startTime: sl.startTime, endTime: sl.endTime, requiredCount: sl.requiredCount })));
        setStaff(d.participants || []); setPrefs(d.preferences || []); setProposals(d.proposals || []);
        setViewToken(d.viewToken || ''); setSelProp(0);
      })
      .catch(e => setPageErr(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const deleteStaff = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    try {
      const res = await fetch(`/api/shifts/${token}/join`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: id }),
      });
      if (!res.ok) throw new Error();
      setStaff(p => p.filter(s => s.id !== id));
      setPrefs(p => p.filter(pf => pf.staffId !== id));
      flash('✅ 削除しました');
    } catch { flash('❌ 削除に失敗しました'); }
  };

  const genProposals = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/shifts/${token}/proposals`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setProposals(d.proposals); setSelProp(0); flash('✅ 候補案を生成しました');
    } catch (e: unknown) {
      flash(`❌ ${e instanceof Error ? e.message : '生成に失敗'}`);
    } finally {
      setGenerating(false);
    }
  };

  const TABS = [
    { label: '⚙️ 基本設定', short: '⚙️', count: null },
    { label: '👥 参加状況', short: '👥', count: staff.length },
    { label: '📋 候補案',   short: '📋', count: proposals.length || null },
    { label: '🔗 共有・出力', short: '🔗', count: null },
  ];

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
      <p className="text-slate-400 text-sm font-medium">読み込み中…</p>
    </div>
  );
  if (pageErr) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-5 p-6">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl">😕</div>
      <p className="text-red-500 font-semibold text-center max-w-sm">{pageErr}</p>
      <a href="/" className="text-indigo-600 hover:underline text-sm font-medium">← ホームに戻る</a>
    </div>
  );

  if (!isEditor) return (
    <>
      {msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold pointer-events-none border ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{msg}</div>
      )}
      <ParticipantView shiftTitle={shiftTitle} slots={slots} token={token} flash={flash} />
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-3 h-14 flex items-center gap-2">
          <a href="/" className="text-indigo-300 hover:text-white text-sm font-medium shrink-0 transition">← Home</a>
          <h1 className="font-black truncate flex-1 text-center tracking-tight text-sm sm:text-base">{shiftTitle}</h1>
          <span className="text-xs bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 px-2.5 py-1 rounded-full font-semibold shrink-0">管理者</span>
        </div>
      </header>

      {msg && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold pointer-events-none border ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{msg}</div>
      )}

      <div className="bg-white border-b sticky top-14 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex overflow-x-auto">
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition border-b-2 ${activeTab === i ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}>
              {t.label}
              {t.count != null && t.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === i ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {activeTab === 0 && (
          <Tab0Settings
            token={token} shiftTitle={shiftTitle} editTitle={editTitle}
            setEditTitle={setEditTitle} editSlots={editSlots} setEditSlots={setEditSlots}
            setShiftTitle={setShiftTitle} flash={flash}
          />
        )}
        {activeTab === 1 && (
          <Tab1Participants
            staff={staff} slots={slots} prefs={prefs} generating={generating}
            token={token} onLoadData={loadData} onGenProposals={genProposals}
            onDeleteStaff={deleteStaff} flash={flash}
          />
        )}
        {activeTab === 2 && (
          <Tab2Proposals
            proposals={proposals} selProp={selProp} generating={generating}
            onSelect={setSelProp} onGenProposals={genProposals}
            onShowDetail={setPropDetailIdx}
          />
        )}
        {activeTab === 3 && (
          <Tab3Share
            token={token} viewToken={viewToken} shiftTitle={shiftTitle}
            proposals={proposals} selProp={selProp} setSelProp={setSelProp} flash={flash}
          />
        )}
      </main>

      {propDetailIdx !== null && proposals[propDetailIdx] && (
        <ProposalDetailModal
          proposal={proposals[propDetailIdx]}
          onClose={() => setPropDetailIdx(null)}
        />
      )}
    </div>
  );
}
