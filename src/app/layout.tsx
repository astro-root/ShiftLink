import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'ShiftLink | シフト作成・共有ツール',
  description: "シフト作成・共有ツール",
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
