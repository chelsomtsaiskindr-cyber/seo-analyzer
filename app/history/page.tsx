'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnalysisResult } from '@/lib/types';
import { getHistory, deleteFromHistory, clearHistory } from '@/lib/storage';
import { exportToPdf } from '@/lib/exportPdf';

const PASS = 60;

function ScoreBadge({ score }: { score: number }) {
  const passed = score >= PASS;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
      {score}
    </span>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);

  useEffect(() => { setHistory(getHistory()); }, []);

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setHistory(getHistory());
    if (expanded === id) setExpanded(null);
  };

  const handleClear = () => {
    if (!confirm('確定要清除所有歷史紀錄嗎？')) return;
    clearHistory();
    setHistory([]);
  };

  const handlePdf = async (r: AnalysisResult, e: React.MouseEvent) => {
    e.stopPropagation();
    setPdfId(r.id);
    await exportToPdf(r);
    setPdfId(null);
  };

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900">歷史紀錄</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-gray-500 text-sm mb-4">還沒有任何分析紀錄</p>
          <Link href="/" className="text-sm text-blue-600 hover:underline">前往分析第一個網址 →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">歷史紀錄</h1>
          <p className="text-sm text-gray-400 mt-1">共 {history.length} 筆分析紀錄</p>
        </div>
        <button onClick={handleClear}
          className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition">
          清除全部
        </button>
      </div>

      <div className="space-y-3">
        {history.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-lg flex-shrink-0 ${r.overall_score >= PASS ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {r.overall_score}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{r.site_name || r.url}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{r.url}</p>
                <p className="text-[10px] text-gray-300 mt-0.5">{new Date(r.analyzedAt).toLocaleString('zh-TW')}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(['seo', 'aeo', 'geo'] as const).map(key => (
                  <div key={key} className="text-center">
                    <p className="text-[9px] text-gray-400 mb-0.5">{key.toUpperCase()}</p>
                    <ScoreBadge score={r[key].score} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={(e) => handlePdf(r, e)} disabled={pdfId === r.id}
                  className="text-gray-400 hover:text-blue-600 text-xs px-2 py-1 rounded-lg hover:bg-blue-50 transition disabled:opacity-40">
                  {pdfId === r.id ? '…' : '↓ PDF'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                  className="text-gray-300 hover:text-red-500 transition">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                </button>
                <span className="text-gray-300 text-xs">{expanded === r.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded === r.id && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">
                {(['seo', 'aeo', 'geo'] as const).map((key, i) => {
                  const cat = r[key];
                  const labels = ['SEO — 搜尋引擎優化', 'AEO — 答案引擎優化', 'GEO — 生成引擎優化'];
                  const colors = ['text-blue-700 bg-blue-50', 'text-teal-700 bg-teal-50', 'text-purple-700 bg-purple-50'];
                  return (
                    <div key={key}>
                      <p className={`text-xs font-semibold px-2 py-1 rounded-lg inline-block mb-2 ${colors[i]}`}>
                        {labels[i]}：{cat.score} 分
                      </p>
                      <ul className="space-y-1">
                        {cat.suggestions.map((s, j) => (
                          <li key={j} className="text-xs text-gray-600 flex gap-2 items-start">
                            <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                <div className="bg-blue-50 border-l-4 border-blue-300 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-blue-600 mb-1">整體建議</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{r.summary}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}