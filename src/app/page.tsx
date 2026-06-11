'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PROBLEMS = [
  { icon: '📱', title: 'LINEで収集が煩雑',       desc: 'メッセージが埋もれて把握できない' },
  { icon: '⏱️', title: '集計に時間がかかる',      desc: '手作業の転記・エクセル管理は非効率' },
  { icon: '😤', title: '希望が重なる',             desc: '調整の連絡が何往復も続く' },
  { icon: '⚖️', title: '公平なシフトが難しい',    desc: '特定の人に偏りがちになる' },
];

const STEPS = [
  { n: '01', icon: '✏️', color: 'from-blue-500 to-indigo-500',
    title: 'シフトを作成',
    desc: '名前をつけて日程・時間帯・必要人数を設定。1〜2分でできます。' },
  { n: '02', icon: '🔗', color: 'from-indigo-500 to-violet-500',
    title: 'リンクをシェア',
    desc: '参加リンクをLINE・メールで送信。スタッフが自分で希望を入力します。' },
  { n: '03', icon: '⚡', color: 'from-violet-500 to-purple-500',
    title: '自動でシフト生成',
    desc: '集まった希望から3種類の最適案を自動生成。比較して選ぶだけ。' },
];

const FEATURES = [
  { icon: '🔗', title: 'リンクで即共有',    desc: 'URLを送るだけ。スタッフの登録不要。' },
  { icon: '👤', title: '自己入力式',         desc: '各自が希望を入力するのでミスが減る。' },
  { icon: '⚡', title: '3案を自動生成',      desc: '希望優先・均等配分・バリエーションを比較。' },
  { icon: '📊', title: '参加状況の見える化', desc: '誰が何を希望しているか一覧確認できる。' },
  { icon: '🖼️', title: '画像・PDF出力',    desc: '確定シフトをワンクリックで出力・配布。' },
  { icon: '🔒', title: '権限を分離',         desc: '管理者リンクと参加リンクを別々に管理。' },
];

export default function Home() {
  const router = useRouter();
  const createRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [token, setToken] = useState('');
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');
  const [openTab, setOpenTab] = useState<'create' | 'open'>('create');

  const scrollToCreate = () =>
    createRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const create = async () => {
    setCreating(true); setErr('');
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || '新しいシフト' }),
      });
      if (!res.ok) throw new Error();
      router.push(`/shifts/${(await res.json()).token}`);
    } catch { setErr('作成に失敗しました。もう一度お試しください。'); setCreating(false); }
  };

  const openShift = () => {
    const raw = token.trim();
    if (!raw) return;
    const m = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    router.push(`/shifts/${m ? m[0] : raw}`);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span className="font-extrabold text-white tracking-tight">ShiftLink</span>
          </div>
          <button onClick={scrollToCreate}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-lg transition-all hover:scale-105">
            無料で始める
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 pt-32 pb-28 text-white overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"/>
          <div className="absolute top-16 right-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl"/>
        </div>

        <div className="section text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/10 rounded-full px-4 py-1.5 text-sm font-medium text-indigo-200 mb-8">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
            完全無料 · アカウント不要
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-6">
            シフト作成を、<br/>
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
              もっとかんたんに。
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            リンクをシェアするだけ。スタッフが自分で希望を入力して、<br className="hidden sm:block"/>
            AIが最適なシフトを自動で3パターン生成します。
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button onClick={scrollToCreate}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:scale-105 shadow-xl shadow-indigo-900/60">
              無料でシフトを作る →
            </button>
            <a href="#how"
              className="inline-flex items-center gap-2 border border-white/15 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-base transition">
              使い方を見る ↓
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-slate-500">
            {['✓ 登録不要', '✓ カード不要', '✓ スマホ対応', '✓ 即日利用可能'].map(t => (
              <span key={t} className="text-slate-400">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problems ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="section">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">PROBLEM</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
              こんな悩みはありませんか？
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              多くの職場で繰り返されているシフト管理の課題です
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="card p-5 card-hover">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-slate-700 text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how" className="py-20 bg-white">
        <div className="section">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">たった3ステップ</h2>
            <p className="text-slate-500">最初のシフト生成まで5分もかかりません</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 relative">
            {STEPS.map((step, i) => (
              <div key={i} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-10 left-[calc(100%+12px)] right-0 h-0.5 bg-gradient-to-r from-indigo-200 to-transparent w-6"/>
                )}
                <div className="card p-6 h-full card-hover">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl mb-5 shadow-lg`}>
                    {step.icon}
                  </div>
                  <p className="text-xs font-black text-indigo-400 tracking-widest mb-1">STEP {step.n}</p>
                  <h3 className="font-black text-slate-900 text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="section">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">FEATURES</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">必要な機能がすべて揃っている</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i}
                className="group bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 cursor-default">
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">{f.icon}</div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full"/>
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full"/>
        </div>

        <div className="max-w-lg mx-auto px-5 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            今すぐ無料で始めよう
          </h2>
          <p className="text-indigo-200 mb-10">クレジットカード不要。アカウント登録不要。</p>

          <div ref={createRef} className="bg-white rounded-2xl p-6 shadow-2xl text-left">
            <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1">
              {(['create', 'open'] as const).map(tab => (
                <button key={tab} onClick={() => setOpenTab(tab)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    openTab === tab ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {tab === 'create' ? '🆕 新規作成' : '🔗 URLを開く'}
                </button>
              ))}
            </div>

            {openTab === 'create' ? (
              <>
                <input type="text" placeholder="シフト名（例: 7月シフト）"
                  value={title} onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && create()}
                  className="input-base mb-3" />
                {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
                <button onClick={create} disabled={creating} className="btn-primary w-full py-3.5 text-base">
                  {creating ? '作成中…' : 'シフトを作成する →'}
                </button>
              </>
            ) : (
              <>
                <input type="text" placeholder="URLまたはトークンを貼り付け"
                  value={token} onChange={e => setToken(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && openShift()}
                  className="input-base mb-3" />
                <button onClick={openShift} className="btn-secondary w-full py-3.5 text-base">
                  シフトを開く
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-500 py-12">
        <div className="section flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span className="font-extrabold text-white tracking-tight">ShiftLink</span>
          </div>
          <p className="text-sm">シフト作成・共有ツール</p>
          <p className="text-xs">© 2026 astro-root</p>
        </div>
      </footer>
    </div>
  );
}
