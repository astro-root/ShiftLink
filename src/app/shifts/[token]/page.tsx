'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

type PrefStatus = 'available' | 'preferred' | 'unavailable';
interface SSlot  { id: number; date: string; startTime: string; endTime: string; requiredCount: number }
interface SStaff { id: number; name: string }
interface SPref  { staffId: number; slotId: number; status: PrefStatus }
interface PSlot  { slotId: number; slotDate: string; slotStart: string; slotEnd: string; requiredCount: number; assigned: { staffId: number; name: string }[] }
interface Proposal { id: number; title: string; score: number; coverageRate: number; data: { assignments: PSlot[] } }
interface EditSlot { date: string; startTime: string; endTime: string; requiredCount: number }

const DAY = ['日','月','火','水','木','金','土'];
const fmtDate = (d: string) => {
  if (!d) return '';
  try { const t = new Date(d+'T00:00:00'); return `${t.getMonth()+1}/${t.getDate()}(${DAY[t.getDay()]})`; } catch { return d; }
};

const PREF_BTN: Record<PrefStatus, { label: string; active: string; inactive: string }> = {
  preferred:   { label: '◎ 希望する',  active: 'bg-emerald-500 text-white shadow-md shadow-emerald-200',    inactive: 'bg-white text-slate-400 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200' },
  available:   { label: '○ 出勤可',    active: 'bg-sky-500 text-white shadow-md shadow-sky-200',             inactive: 'bg-white text-slate-400 border border-slate-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200' },
  unavailable: { label: '✗ 出勤不可',  active: 'bg-red-500 text-white shadow-md shadow-red-200',             inactive: 'bg-white text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200' },
};

const PREF_BADGE: Record<PrefStatus, string> = {
  preferred:   'bg-emerald-50 text-emerald-700 border border-emerald-100',
  available:   'bg-slate-50 text-slate-500 border border-slate-100',
  unavailable: 'bg-red-50 text-red-600 border border-red-100',
};

const AVATAR_COLORS = [
  'from-indigo-400 to-blue-500','from-violet-400 to-purple-500','from-pink-400 to-rose-500',
  'from-emerald-400 to-teal-500','from-amber-400 to-orange-500','from-cyan-400 to-sky-500',
];

function buildExportHtml(title: string, prop: Proposal): string {
  const rows = prop.data.assignments.map((a, i) => `
    <tr style="background:${i%2===0?'#fff':'#f8fafc'}">
      <td style="padding:8px 14px;border:1px solid #e2e8f0;">${fmtDate(a.slotDate)}</td>
      <td style="padding:8px 14px;border:1px solid #e2e8f0;">${a.slotStart}〜${a.slotEnd}</td>
      <td style="padding:8px 14px;border:1px solid #e2e8f0;text-align:center;">${a.requiredCount}人</td>
      <td style="padding:8px 14px;border:1px solid #e2e8f0;color:${a.assigned.length<a.requiredCount?'#e53e3e':'#1a202c'};">
        ${a.assigned.map(s=>s.name).join('、')||'（未割当）'}
      </td>
    </tr>`).join('');
  return `<div style="font-family:sans-serif;padding:28px;min-width:680px;background:#fff;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;">${title}</h1>
    <p style="font-size:13px;color:#64748b;margin:0 0 20px;">${prop.title} ｜ 希望適合率 ${prop.score}% ／ 充足率 ${prop.coverageRate}%</p>
    <table style="border-collapse:collapse;width:100%;font-size:13px;">
      <thead><tr style="background:#4f46e5;color:#fff;">
        <th style="padding:10px 14px;text-align:left;">日程</th><th style="padding:10px 14px;text-align:left;">時間帯</th>
        <th style="padding:10px 14px;text-align:center;">必要</th><th style="padding:10px 14px;text-align:left;">担当</th>
      </tr></thead><tbody>${rows}</tbody>
    </table>
    <p style="font-size:11px;color:#94a3b8;margin-top:16px;">出力日: ${new Date().toLocaleDateString('ja-JP')} ｜ ShiftLink</p>
  </div>`;
}

export default function ShiftPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading]       = useState(true);
  const [pageErr, setPageErr]       = useState('');
  const [msg, setMsg]               = useState('');
  const [isEditor, setIsEditor]     = useState(false);
  const [activeTab, setActiveTab]   = useState(0);
  const [shiftTitle, setShiftTitle] = useState('');
  const [slots, setSlots]           = useState<SSlot[]>([]);
  const [editTitle, setEditTitle]   = useState('');
  const [editSlots, setEditSlots]   = useState<EditSlot[]>([]);
  const [newSlot, setNewSlot]       = useState<EditSlot>({ date:'', startTime:'09:00', endTime:'17:00', requiredCount:1 });
  const [staff, setStaff]           = useState<SStaff[]>([]);
  const [prefs, setPrefs]           = useState<SPref[]>([]);
  const [proposals, setProposals]   = useState<Proposal[]>([]);
  const [selProp, setSelProp]       = useState(0);
  const [viewToken, setViewToken]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [generating, setGenerating] = useState(false);
  const [partName, setPartName]     = useState('');
  const [partPrefs, setPartPrefs]   = useState<Map<number,PrefStatus>>(new Map());
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const flash = useCallback((m: string) => { setMsg(m); setTimeout(()=>setMsg(''), 3200); },[]);

  useEffect(() => {
    fetch(`/api/shifts/${token}`)
      .then(async r => {
        if (r.status === 404) throw new Error('シフトが見つかりません。URLを確認してください。');
        if (!r.ok) throw new Error('読み込みに失敗しました');
        return r.json();
      })
      .then(d => {
        setIsEditor(d.isEditor); setShiftTitle(d.title); setEditTitle(d.title);
        setSlots(d.slots); setEditSlots(d.slots.map((s:SSlot)=>({date:s.date,startTime:s.startTime,endTime:s.endTime,requiredCount:s.requiredCount})));
        setStaff(d.staff); setPrefs(d.preferences); setProposals(d.proposals);
        setViewToken(d.viewToken||''); setSelProp(0);
      })
      .catch(e=>setPageErr(e.message))
      .finally(()=>setLoading(false));
  }, [token]);

  const addSlot = () => {
    const {date,startTime,endTime,requiredCount} = newSlot;
    if (!date||!startTime||!endTime) { flash('⚠️ 日付と時間を入力してください'); return; }
    if (startTime>=endTime) { flash('⚠️ 終了時刻は開始より後にしてください'); return; }
    setEditSlots(p=>[...p,{date,startTime,endTime,requiredCount}]);
    setNewSlot({date:'',startTime:'09:00',endTime:'17:00',requiredCount:1});
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/shifts/${token}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:editTitle,slots:editSlots})});
      if (!res.ok) throw new Error((await res.json()).error);
      setShiftTitle(editTitle); flash('✅ 保存しました');
    } catch(e:unknown){flash(`❌ ${e instanceof Error?e.message:'保存に失敗'}`);}
    finally{setSaving(false);}
  };

  const deleteStaff = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    try {
      const res = await fetch(`/api/shifts/${token}/join?staffId=${id}`,{method:'DELETE'});
      if (!res.ok) throw new Error();
      setStaff(p=>p.filter(s=>s.id!==id)); setPrefs(p=>p.filter(p=>p.staffId!==id));
      flash('✅ 削除しました');
    } catch{flash('❌ 削除に失敗しました');}
  };

  const genProposals = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/shifts/${token}/proposals`,{method:'POST'});
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setProposals(d.proposals); setSelProp(0); flash('✅ 候補案を生成しました');
    } catch(e:unknown){flash(`❌ ${e instanceof Error?e.message:'生成に失敗'}`);}
    finally{setGenerating(false);}
  };

  const withTmp = async (html:string, cb:(el:HTMLElement)=>Promise<void>) => {
    const w=document.createElement('div'); w.style.cssText='position:fixed;top:0;left:0;z-index:9999;pointer-events:none;'; w.innerHTML=html; document.body.appendChild(w);
    try{await cb(w.firstElementChild as HTMLElement);}finally{document.body.removeChild(w);}
  };
  const exportImage = async () => {
    const p=proposals[selProp]; if(!p){flash('❌ 候補案を選択');return;}
    try{ const {default:h2c}=await import('html2canvas'); await withTmp(buildExportHtml(shiftTitle,p),async el=>{const c=await h2c(el,{scale:2,useCORS:true,backgroundColor:'#fff'});const a=document.createElement('a');a.download=`${shiftTitle}.png`;a.href=c.toDataURL('image/png');a.click();}); flash('✅ 画像を保存しました');
    }catch{flash('❌ 画像出力に失敗しました');}
  };
  const exportPDF = async () => {
    const p=proposals[selProp]; if(!p){flash('❌ 候補案を選択');return;}
    try{ const {default:h2c}=await import('html2canvas'); const {jsPDF}=await import('jspdf');
      await withTmp(buildExportHtml(shiftTitle,p),async el=>{const c=await h2c(el,{scale:2,useCORS:true,backgroundColor:'#fff'});const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});const pw=pdf.internal.pageSize.getWidth();pdf.addImage(c.toDataURL('image/png'),'PNG',0,0,pw,Math.min((c.height*pw)/c.width,pdf.internal.pageSize.getHeight()));pdf.save(`${shiftTitle}.pdf`);});
      flash('✅ PDFを保存しました');
    }catch{flash('❌ PDF出力に失敗しました');}
  };
  const copyLink = async (url:string) => {try{await navigator.clipboard.writeText(url);flash('✅ コピーしました');}catch{flash('❌ コピーに失敗しました');}};
  const regenToken = async () => {try{const res=await fetch(`/api/shifts/${token}`,{method:'PATCH'});const d=await res.json();setViewToken(d.viewToken);flash('✅ 参加リンクを再発行しました');}catch{flash('❌ 再発行に失敗しました');}};
  const submitJoin = async () => {
    if(!partName.trim()){flash('⚠️ 名前を入力してください');return;}
    setSubmitting(true);
    try {
      const res=await fetch(`/api/shifts/${token}/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:partName.trim(),preferences:slots.map(sl=>({slotId:sl.id,status:partPrefs.get(sl.id)??'available'}))})});
      const d=await res.json(); if(!res.ok) throw new Error(d.error);
      setSubmitted(true);
    }catch(e:unknown){flash(`❌ ${e instanceof Error?e.message:'送信に失敗しました'}`);}
    finally{setSubmitting(false);}
  };

  const base = typeof window!=='undefined' ? window.location.origin : '';
  const getStaffPref = (sid:number,slid:number):PrefStatus =>
    prefs.find(p=>p.staffId===sid&&p.slotId===slid)?.status??'available';
  const TABS = [
    {label:'⚙️ 基本設定', count:null},
    {label:'👥 参加状況', count:staff.length},
    {label:'📋 候補案',   count:proposals.length||null},
    {label:'🔗 共有・出力',count:null},
  ];

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"/>
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

  /* ── Participant View ── */
  if (!isEditor) {
    if (submitted) return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg shadow-emerald-200">✅</div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">送信しました！</h2>
          <p className="text-slate-500"><span className="font-bold text-indigo-600">{partName}</span> さんの希望を受け付けました。</p>
          <p className="text-slate-400 text-sm mt-1.5">管理者がシフトを確定するまでお待ちください。</p>
        </div>
        <button onClick={()=>{setSubmitted(false);setPartPrefs(new Map());setPartName('');}}
          className="text-sm text-indigo-500 hover:text-indigo-700 border border-indigo-200 rounded-xl px-5 py-2.5 hover:bg-indigo-50 transition font-medium">
          ✏️ 内容を修正して再送信
        </button>
      </div>
    );

    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 text-white">
          <div className="max-w-2xl mx-auto px-5 py-8">
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">シフト希望入力</p>
            <h1 className="text-2xl font-black">{shiftTitle}</h1>
          </div>
        </header>

        {msg && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold pointer-events-none border ${msg.startsWith('✅')?'bg-emerald-50 text-emerald-800 border-emerald-100':'bg-red-50 text-red-700 border-red-100'}`}>{msg}</div>
        )}

        <main className="max-w-2xl mx-auto px-4 py-7 space-y-4">
          {slots.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl mb-3">🗓️</div>
              <p className="font-semibold text-slate-600">まだ日程が設定されていません</p>
              <p className="text-sm text-slate-400 mt-1">管理者にお問い合わせください。</p>
            </div>
          ) : (<>
            <div className="card p-5">
              <label className="block text-sm font-bold text-slate-700 mb-2.5">👤 あなたのお名前</label>
              <input value={partName} onChange={e=>setPartName(e.target.value)} placeholder="例: 田中 太郎" className="input-base text-base"/>
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
                    {(['preferred','available','unavailable'] as PrefStatus[]).map(status => (
                      <button key={status} onClick={()=>setPartPrefs(p=>new Map(p).set(slot.id,status))}
                        className={`py-3 rounded-xl text-sm font-bold transition-all duration-150 ${cur===status ? PREF_BTN[status].active : PREF_BTN[status].inactive}`}>
                        {PREF_BTN[status].label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <button onClick={submitJoin} disabled={submitting||!partName.trim()}
              className="btn-primary w-full py-4 text-base">
              {submitting ? '送信中…' : '✈️  希望を送信する'}
            </button>
          </>)}
        </main>
      </div>
    );
  }

  /* ── Admin View ── */
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/" className="text-indigo-300 hover:text-white text-sm font-medium shrink-0 transition">← Home</a>
          <h1 className="font-black truncate flex-1 text-center tracking-tight">{shiftTitle}</h1>
          <span className="text-xs bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 px-2.5 py-1 rounded-full font-semibold shrink-0">管理者</span>
        </div>
      </header>

      {msg && (
        <div className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold pointer-events-none border ${msg.startsWith('✅')?'bg-emerald-50 text-emerald-800 border-emerald-100':'bg-red-50 text-red-700 border-red-100'}`}>{msg}</div>
      )}

      <div className="bg-white border-b sticky top-14 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex overflow-x-auto">
          {TABS.map((t,i) => (
            <button key={i} onClick={()=>setActiveTab(i)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition border-b-2 ${activeTab===i?'border-indigo-600 text-indigo-600 bg-indigo-50/50':'border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}>
              {t.label}
              {t.count!=null&&t.count>0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab===i?'bg-indigo-100 text-indigo-700':'bg-slate-100 text-slate-500'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Tab 0 */}
        {activeTab===0 && (<>
          <div className="card p-5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">シフト名</label>
            <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} className="input-base" placeholder="シフト名を入力"/>
          </div>
          <div className="card p-5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">時間帯の管理</label>
            {editSlots.length===0 && <p className="text-sm text-slate-400 mb-3">時間帯が設定されていません</p>}
            <div className="space-y-2 mb-4">
              {editSlots.map((sl,i)=>(
                <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 group">
                  <span className="font-bold text-indigo-600 text-sm">{fmtDate(sl.date)}</span>
                  <span className="text-slate-600 text-sm">{sl.startTime}〜{sl.endTime}</span>
                  <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">×{sl.requiredCount}人</span>
                  <button onClick={()=>setEditSlots(p=>p.filter((_,j)=>j!==i))} className="ml-auto text-slate-200 hover:text-red-500 text-xl leading-none font-black transition group-hover:text-slate-300">×</button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input type="date" value={newSlot.date} onChange={e=>setNewSlot(p=>({...p,date:e.target.value}))} className="col-span-2 sm:col-span-1 input-base text-sm py-2"/>
              <input type="time" value={newSlot.startTime} onChange={e=>setNewSlot(p=>({...p,startTime:e.target.value}))} className="input-base text-sm py-2"/>
              <input type="time" value={newSlot.endTime} onChange={e=>setNewSlot(p=>({...p,endTime:e.target.value}))} className="input-base text-sm py-2"/>
              <div className="flex gap-2">
                <select value={newSlot.requiredCount} onChange={e=>setNewSlot(p=>({...p,requiredCount:Number(e.target.value)}))} className="input-base text-sm py-2 flex-1">
                  {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}人</option>)}
                </select>
                <button onClick={addSlot} className="btn-primary text-sm py-2 px-4 whitespace-nowrap">追加</button>
              </div>
            </div>
            {editSlots.length>0 && <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3 mt-3">⚠️ 日程を変更すると既存の参加者の希望がリセットされます。</p>}
          </div>
          <button onClick={saveSettings} disabled={saving} className="btn-primary w-full py-3.5">{saving?'保存中…':'💾 保存する'}</button>
        </>)}

        {/* Tab 1 */}
        {activeTab===1 && (<>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-black text-slate-900 text-lg">{staff.length}名が回答済み</h2>
              <p className="text-sm text-slate-400 mt-0.5">参加リンクをシェアして希望を収集してください</p>
            </div>
            <button onClick={genProposals} disabled={generating||staff.length===0} className="btn-primary text-sm py-2.5 flex items-center gap-2 shrink-0">
              {generating?'⏳ 生成中…':'🔄 候補案を生成'}
            </button>
          </div>
          {staff.length===0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">👥</div>
              <p className="font-bold text-slate-600 mb-1">まだ参加者がいません</p>
              <p className="text-sm text-slate-400">「共有・出力」タブから参加リンクをシェアしてください</p>
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((s,si) => (
                <div key={s.id} className="card p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[si%AVATAR_COLORS.length]} flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0`}>
                      {s.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400">{slots.length}件の日程</p>
                    </div>
                    <button onClick={()=>deleteStaff(s.id)}
                      className="text-xs text-slate-300 hover:text-red-500 border border-slate-100 hover:border-red-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-semibold shrink-0">
                      削除
                    </button>
                  </div>
                  {slots.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {slots.map(sl => {
                        const st = getStaffPref(s.id, sl.id);
                        return (
                          <span key={sl.id} className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${PREF_BADGE[st]}`}>
                            {st==='preferred'?'◎':st==='unavailable'?'✗':'○'} {fmtDate(sl.date)} {sl.startTime}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* Tab 2 */}
        {activeTab===2 && (<>
          <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-slate-500 flex-1">参加者の希望をもとに3種類の最適案を生成します。カードをクリックして選択し、出力タブから保存できます。</p>
            <button onClick={genProposals} disabled={generating} className="btn-primary text-sm py-2.5 whitespace-nowrap shrink-0">
              {generating?'⏳ 生成中…':'🔄 候補案を生成'}
            </button>
          </div>
          {proposals.length===0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="font-bold text-slate-600 mb-1">候補案がまだありません</p>
              <p className="text-sm text-slate-400">参加者の希望が集まったら「候補案を生成」してください</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {proposals.map((prop,pi) => (
                <div key={prop.id} onClick={()=>setSelProp(pi)}
                  className={`card p-5 cursor-pointer transition-all border-2 ${selProp===pi?'border-indigo-500 shadow-lg shadow-indigo-100/60 ring-2 ring-indigo-100':'border-transparent card-hover'}`}>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h3 className="font-black text-slate-900">{prop.title}</h3>
                    {selProp===pi && <span className="badge bg-indigo-100 text-indigo-700 shrink-0">選択中 ✓</span>}
                  </div>

                  {/* Score bars */}
                  <div className="space-y-2 mb-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 font-medium">希望適合率</span>
                        <span className="font-black text-emerald-600">{prop.score}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all" style={{width:`${prop.score}%`}}/>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 font-medium">充足率</span>
                        <span className={`font-black ${prop.coverageRate<100?'text-red-500':'text-indigo-600'}`}>{prop.coverageRate}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${prop.coverageRate<100?'bg-gradient-to-r from-red-400 to-orange-400':'bg-gradient-to-r from-indigo-400 to-violet-400'}`} style={{width:`${prop.coverageRate}%`}}/>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {prop.data.assignments.map((a,ai)=>(
                      <div key={ai} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${a.assigned.length<a.requiredCount?'bg-red-50':'bg-slate-50'}`}>
                        <span className="font-semibold text-slate-500 shrink-0">{fmtDate(a.slotDate)}</span>
                        <span className={a.assigned.length>0?'text-slate-700':'text-red-400 font-medium'}>
                          {a.assigned.length>0?a.assigned.map(s=>s.name).join('、'):'未割当'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* Tab 3 */}
        {activeTab===3 && (<>
          <div className="card p-5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">🔗 リンクの共有</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-100">参加リンク</span>
                  <span className="text-xs text-slate-400">スタッフに送るリンク</span>
                </div>
                <div className="flex gap-2">
                  <input readOnly value={`${base}/shifts/${viewToken}`} className="flex-1 input-base text-sm bg-slate-50 min-w-0 cursor-text text-slate-600 font-mono"/>
                  <button onClick={()=>copyLink(`${base}/shifts/${viewToken}`)} className="btn-secondary text-sm py-2 px-4 shrink-0">コピー</button>
                </div>
                <button onClick={regenToken} className="mt-1.5 text-xs text-red-400 hover:text-red-600 underline">参加リンクを再発行（現在のリンクは無効になります）</button>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">管理リンク</span>
                  <span className="text-xs text-slate-400">このページのURL</span>
                </div>
                <div className="flex gap-2">
                  <input readOnly value={`${base}/shifts/${token}`} className="flex-1 input-base text-sm bg-slate-50 min-w-0 cursor-text text-slate-600 font-mono"/>
                  <button onClick={()=>copyLink(`${base}/shifts/${token}`)} className="btn-secondary text-sm py-2 px-4 shrink-0">コピー</button>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">📥 シフト表の出力</h3>
            {proposals.length===0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">先に「候補案」タブで候補案を生成してください</p>
              </div>
            ) : (<>
              <div className="mb-4">
                <label className="text-sm font-semibold text-slate-600 mb-2 block">出力する候補案</label>
                <select value={selProp} onChange={e=>setSelProp(Number(e.target.value))} className="input-base text-sm">
                  {proposals.map((p,i)=>(
                    <option key={p.id} value={i}>{p.title}（希望適合 {p.score}% ／ 充足率 {p.coverageRate}%）</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={exportImage} className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all text-sm">🖼️ 画像で保存</button>
                <button onClick={exportPDF}   className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all text-sm">📄 PDFで保存</button>
              </div>
            </>)}
          </div>
        </>)}
      </main>
    </div>
  );
}
