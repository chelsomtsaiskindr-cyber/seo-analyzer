import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEO / AEO / GEO 網址分析工具',
  description: '分析網頁的搜尋引擎、答案引擎、生成引擎優化程度',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 no-underline">
              <span className="text-lg">⚡</span>
              <span>OptimizeIQ</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-900 transition-colors no-underline">分析</Link>
              <Link href="/history" className="hover:text-gray-900 transition-colors no-underline">歷史紀錄</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}