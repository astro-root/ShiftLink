import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ShiftLink | シフト作成・共有ツール';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@900',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.54.16' } }
    ).then(r => r.text());
    const url = css.match(/url\((.+?)\) format\('truetype'\)/)?.[1];
    if (!url) return null;
    return fetch(url).then(r => r.arrayBuffer());
  } catch { return null; }
}

export default async function Image() {
  const fontData = await loadFont();
  return new ImageResponse(
    (
      <div style={{
        width: 1200, height: 630,
        background: '#070714',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        fontFamily: fontData ? 'NotoSansJP' : 'sans-serif',
      }}>
        <div style={{
          position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 900, height: 700, borderRadius: '50%', display: 'flex',
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.22) 0%, transparent 65%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, right: -80,
          width: 480, height: 480, borderRadius: '50%', display: 'flex',
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 65%)',
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, padding: '0 80px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(129,140,248,0.3)',
            borderRadius: 100, padding: '8px 22px', marginBottom: 36,
          }}>
            <div style={{ width: 10, height: 10, background: '#4ade80', borderRadius: '50%', display: 'flex' }} />
            <span style={{ color: '#a5b4fc', fontSize: 20, fontWeight: 600 }}>完全無料 · アカウント不要</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 84, fontWeight: 900, color: '#ffffff', letterSpacing: '-3px', lineHeight: 1.1, display: 'flex' }}>
              シフト作成を、
            </span>
            <span style={{ fontSize: 84, fontWeight: 900, color: '#a5b4fc', letterSpacing: '-3px', lineHeight: 1.1, display: 'flex' }}>
              もっとかんたんに。
            </span>
          </div>
          <span style={{ fontSize: 26, color: '#64748b', textAlign: 'center', lineHeight: 1.6, marginBottom: 44, display: 'flex' }}>
            リンクをシェアするだけで希望が集まり、AIが最適なシフトを自動生成
          </span>
          <div style={{ display: 'flex', gap: 12, marginBottom: 44 }}>
            {['リンクで即共有', 'AI 自動生成', '画像・PDF 出力'].map(tag => (
              <div key={tag} style={{
                background: 'rgba(30,27,75,0.8)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 12, padding: '10px 22px', display: 'flex',
              }}>
                <span style={{ color: '#c7d2fe', fontSize: 20, fontWeight: 700 }}>{tag}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>📅</div>
            <span style={{ fontSize: 38, fontWeight: 900, color: '#ffffff', letterSpacing: '-1px', display: 'flex' }}>
              ShiftLink
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData ? { fonts: [{ name: 'NotoSansJP', data: fontData, weight: 900 }] } : {}),
    }
  );
}
