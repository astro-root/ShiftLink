'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'create' | 'open';

const PROBLEMS = [
  { icon: '📱', title: 'LINEが埋もれる',   desc: 'メッセージが流れて誰が返信したか把握できない' },
  { icon: '📊', title: '集計が手作業',      desc: 'エクセルへの転記・集計で毎回1〜2時間が消える' },
  { icon: '😤', title: '調整が何往復も',    desc: '希望が重なるたびに全員の時間が奪われる' },
  { icon: '⚖️', title: '偏りが生まれる',   desc: '気づけば特定のスタッフにしわ寄せが集中' },
];

const STEPS = [
  { icon: '✏️', color: 'from-indigo-500 to-blue-600',
    title: 'シフトを作成', desc: '名前と日程を入力するだけ。1〜2分で完了。' },
  { icon: '🔗', color: 'from-violet-500 to-indigo-600',
    title: 'リンクをシェア', desc: 'URLをLINEで送信。スタッフがブラウザから直接入力。' },
  { icon: '⚡', color: 'from-purple-500 to-violet-600',
    title: 'AIが自動生成', desc: '希望をもとに3パターンを自動生成。選ぶだけ。' },
];

const FEATURES = [
  { icon: '🔗', title: 'リンクで即共有',     desc: 'URLを送るだけ。スタッフの登録は不要。' },
  { icon: '✏️', title: '各自が自己入力',     desc: 'スタッフが直接入力するのでミスが減る。' },
  { icon: '⚡', title: '3案を自動生成',       desc: '優先度別・均等・バランスの3案を比較。' },
  { icon: '👁️', title: '参加状況を一覧確認', desc: '誰がいつ希望しているか即座に把握。' },
  { icon: '🖼️', title: '画像・PDF出力',     desc: '確定シフトをワンクリックで出力・配布。' },
  { icon: '🔒', title: '権限分離',            desc: '管理者URLと参加URLを別々に管理。' },
];

const FAQS = [
  { q: 'アカウント登録は必要ですか？',
    a: '不要です。シフトを作成するとURLが発行されます。そのURLを保存するだけで次回以降もアクセスできます。' },
  { q: 'スタッフはアプリをインストールする必要がありますか？',
    a: '不要です。送られた参加リンクをブラウザで開くだけで希望を入力できます。LINEのリンクをタップするだけでOKです。' },
  { q: '何人まで・何件まで使えますか？',
    a: '現在は人数・件数ともに制限なく完全無料でご利用いただけます。' },
  { q: '希望を送信したあとに変更できますか？',
    a: 'できます。同じ名前で再送信すると希望内容が上書き更新されます。' },
  { q: '生成されたシフト案は手動で編集できますか？',
    a: '現在は3つの候補案から選択して画像・PDF出力ができます。手動編集機能は今後追加予定です。' },
  { q: 'データはどこに保存されますか？',
    a: 'クラウドデータベース（Turso / libSQL）に安全に保存されます。URLを知らない第三者はアクセスできません。' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left flex items-center justify-between gap-4 py-5 px-1 min-h-[56px]"
      >
        <span className="font-bold text-slate-800 text-sm sm:text-base leading-snug">{q}</span>
        <span className={`text-indigo-500 text-2xl leading-none shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="pb-5 px-1">
          <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

function ContactForm() {
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [err, setErr]         = useState('');

  const submit = async () => {
    if (!email.trim() || !message.trim()) { setErr('メールアドレスとお問い合わせ内容は必須です'); return; }
    setSending(true); setErr('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSent(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '送信に失敗しました。しばらく経ってから再度お試しください。');
    } finally { setSending(false); }
  };

  if (sent) return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
      <div className="text-4xl mb-3">✅</div>
      <h3 className="font-black text-emerald-800 text-lg mb-1">送信しました</h3>
      <p className="text-emerald-600 text-sm">お問い合わせありがとうございます。内容を確認の上、ご返信します。</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">お名前（任意）</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="田中 太郎" className="input-base text-sm" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">メールアドレス <span className="text-red-500">*</span></label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" className="input-base text-sm" />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">お問い合わせ内容 <span className="text-red-500">*</span></label>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="ご質問・ご要望・バグ報告などをご記入ください"
          rows={4}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 placeholder:text-slate-400 bg-white transition resize-none text-sm" />
      </div>
      {err && <p className="text-red-500 text-sm">{err}</p>}
      <button onClick={submit} disabled={sending || !email.trim() || !message.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black py-4 rounded-xl text-sm transition-all disabled:opacity-60">
        {sending ? '送信中…' : '送信する →'}
      </button>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const createRef = useRef<HTMLDivElement>(null);
  const [title, setTitle]     = useState('');
  const [token, setToken]     = useState('');
  const [creating, setCreating] = useState(false);
  const [err, setErr]         = useState('');
  const [openTab, setOpenTab] = useState<Tab>('create');

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

      {/* ── Navbar ────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#070714]/85 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span className="font-black text-white tracking-tight text-lg">ShiftLink</span>
          </div>
          <button onClick={scrollToCreate}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all">
            無料で始める
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative bg-[#070714] pt-28 pb-24 sm:pt-36 sm:pb-32 overflow-hidden">
        {/* Shift-grid texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(129,140,248,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.12) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}/>
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-700/10 rounded-full blur-3xl pointer-events-none"/>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/20 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-8 tracking-wide">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
            完全無料 · アカウント不要 · 登録ゼロ
          </div>

          <h1 className="font-black text-white leading-[1.05] tracking-tighter mb-6"
            style={{fontSize: 'clamp(2.6rem, 9vw, 5.2rem)'}}>
            シフト作成を、<br/>
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">
              もっとかんたんに。
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            リンクをシェアするだけで希望が集まり、<br className="hidden sm:block"/>
            AIが最適なシフトを自動で3パターン生成します。
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-10">
            <button onClick={scrollToCreate}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl text-base transition-all shadow-xl shadow-indigo-900/60">
              無料でシフトを作る →
            </button>
            <a href="#how"
              className="inline-flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 text-slate-300 font-semibold px-8 py-4 rounded-2xl text-base transition">
              使い方を見る ↓
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs text-slate-600">
            {['✓ 登録不要', '✓ カード不要', '✓ スマホ対応', '✓ 即日利用可能'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problems ──────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.15em] mb-2">PROBLEM</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">こんな悩みはありませんか？</h2>
          </div>
          {/* Horizontal scroll on mobile, grid on sm+ */}
          <div className="flex overflow-x-auto gap-3 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 snap-x snap-mandatory">
            {PROBLEMS.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm shrink-0 w-[72vw] sm:w-auto snap-start">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-black text-slate-800 text-sm mb-1.5">{p.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <section id="how" className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.15em] mb-2">HOW IT WORKS</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">たった3ステップ</h2>
            <p className="text-slate-400 text-sm">最初のシフト生成まで5分もかかりません</p>
          </div>
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-5">
            {STEPS.map((step, i) => (
              <div key={i} className="relative flex sm:flex-col gap-4 sm:gap-0 bg-slate-50 rounded-2xl p-5 sm:p-6">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-12 left-[calc(100%+10px)] w-5 h-0.5 bg-gradient-to-r from-indigo-200 to-transparent"/>
                )}
                <div className={`w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl shadow-lg sm:mb-5`}>
                  {step.icon}
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-400 tracking-widest mb-1">STEP 0{i + 1}</p>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg mb-1.5">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.15em] mb-2">FEATURES</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">必要な機能がすべて揃っている</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/80 transition-all duration-200">
                <div className="text-2xl sm:text-3xl mb-2.5">{f.icon}</div>
                <h3 className="font-black text-slate-800 text-xs sm:text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}/>
        <div className="relative z-10 max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">今すぐ無料で始めよう</h2>
            <p className="text-indigo-200 text-sm">クレジットカード不要・アカウント登録不要</p>
          </div>

          <div ref={createRef} className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1">
              {(['create', 'open'] as const).map(tab => (
                <button key={tab} onClick={() => setOpenTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${openTab === tab ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab === 'create' ? '🆕 新規作成' : '🔗 URLを開く'}
                </button>
              ))}
            </div>

            {openTab === 'create' ? (<>
              <input type="text" placeholder="シフト名（例: 7月シフト）"
                value={title} onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && create()}
                className="input-base mb-3 text-base" />
              {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
              <button onClick={create} disabled={creating}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black py-4 rounded-xl text-base transition-all disabled:opacity-60 shadow-lg shadow-indigo-200">
                {creating ? '作成中…' : 'シフトを作成する →'}
              </button>
            </>) : (<>
              <input type="text" placeholder="URLまたはトークンを貼り付け"
                value={token} onChange={e => setToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && openShift()}
                className="input-base mb-3 text-base" />
              <button onClick={openShift}
                className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-black py-4 rounded-xl text-base transition-all">
                シフトを開く
              </button>
            </>)}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.15em] mb-2">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">よくある質問</h2>
          </div>
          <div className="bg-slate-50 rounded-2xl px-5 sm:px-6">
            {FAQS.map((f, i) => <FaqItem key={i} {...f} />)}
          </div>
          <p className="text-center text-sm text-slate-400 mt-8">
            解決しない場合は下のフォームからお問い合わせください。
          </p>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.15em] mb-2">CONTACT</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">お問い合わせ</h2>
            <p className="text-slate-400 text-sm">ご質問・ご要望・バグ報告などお気軽にどうぞ</p>
          </div>
          <ContactForm />
        </div>
      </section>

            {/* ── Footer ────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-500 py-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span className="font-black text-white tracking-tight">ShiftLink</span>
          </div>

          <p className="text-xs">© 2026 astro-root</p>
        </div>
      </footer>

      {/* ── Sticky mobile CTA ─────────────────────────── */}
      {/* pb-[env(safe-area-inset-bottom)] for iPhone notch */}
      <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <button onClick={scrollToCreate}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-black py-4 rounded-2xl text-base transition-all shadow-lg shadow-indigo-200">
          無料でシフトを作る →
        </button>
      </div>
    </div>
  );
}
