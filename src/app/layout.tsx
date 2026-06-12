import type { Metadata } from 'next';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'ShiftLink | シフト作成・共有ツール',
  description: 'リンクをシェアするだけ。スタッフが自分で希望を入力して、AIが最適なシフトを自動で3パターン生成します。完全無料・アカウント不要。',
  openGraph: {
    title: 'ShiftLink | シフト作成・共有ツール',
    description: 'リンクをシェアするだけ。AIが最適なシフトを自動で3パターン生成。完全無料・アカウント不要。',
    url: siteUrl,
    siteName: 'ShiftLink',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShiftLink | シフト作成・共有ツール',
    description: 'リンクをシェアするだけ。AIが最適なシフトを自動で3パターン生成。完全無料・アカウント不要。',
  },
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
