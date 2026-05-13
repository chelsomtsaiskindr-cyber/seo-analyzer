'use client';

import { useState, useEffect, useRef } from 'react';
import { AnalysisResult, CategoryResult } from '@/lib/types';
import { saveToHistory } from '@/lib/storage';
import { exportToPdf } from '@/lib/exportPdf';

const PASS = 60;

function CircleScore({ score, label, color }: { score: number; label: string; color: 'blue' | 'teal' | 'purple' }) {
  const [displayed, setDisplayed] = useState(0);
  const R = 44;
  const circ = 2 * Math.PI * R;
  const offset = circ - (displayed / 100) * circ;
  const passed = displayed >= PASS;

  const styles = {
    blue:   { stroke: '#378ADD', light: '#E6F1FB', text: '#0C447C', badgeBg: '#dbeeff' },
    teal:   { stroke: '#1D9E75', light: '#E1F5EE', text: '#085041', badgeBg: '#d0f5e8' },
    purple: { stroke: '#7F77DD', light: '#EEEDFE', text: '#3C3489', badgeBg: '#e5e2fd' },
  };
  const s = styles[color];

  useEffect(() => {
    let start: number | null = null;
    const duration = 1100;
    const raf = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(score * eased));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg width={112} height={112} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={56} cy={56} r={R} fill="none" stroke="#e5e7eb" strokeWidth={9} />
          <circle cx={56} cy={56} r={R} fill="none"
            stroke={passed ? s.stroke : '#E24B4A'} strokeWidth={9}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-medium" style={{ color: passed ? s.stroke : '#E24B4A' }}>{displayed}</span>
          <span className="text-[10px] text-gray-400">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-medium text-gray-800 text-sm">{label}</p>
        <span className="mt-1 inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: passed ? s.badgeBg : '#fee2e2', color: passed ? s.text : '#7f1d1d' }}>
          {passed ? '✓ 及格' : '✗ 需改善'}
        </span>
      </div>
    </div>
  );
}

function ScoreCard({ label, color, data }: { label: string; color: 'blue' | 'teal' | 'purple'; data: CategoryResult }) {
  const [open, setOpen] = useState(false);
  const styles = {
    blue:   { bg: '#E6F1FB', border: '#B5D4F4', text: '#0C447C', dot: '#378ADD' },
    teal:   { bg: '#E1F5EE', border: '#9FE1CB', text: '#085041', dot: '#1D9E75' },
    purple: { bg: '#EEEDFE', border: '#CECBF6', text: '#3C3489', dot: '#7F77DD' },
  };
  const s = styles[color];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ background: s.bg, borderBottom: `1px solid ${s.border}` }}>
        <span className="font-medium text-sm" style={{ color: s.text }}>{label}</span>
        <span className="font-semibold text-sm" style={{ color: s.text }}>{data.score} 分</span>
      </div>
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-y-2 mb-4">
          {data.details.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[11px] font-semibold w-12 text-center py-0.5 rounded-full flex-shrink-0"
                style={{ background: d.pass ? '#dcfce7' : '#fee2e2', color: d.pass ? '#166534' : '#7f1d1d' }}>
                {d.pass ? '✓ 通過' : '✗ 未過'}
              </span>
              <span className="text-xs text-gray-600">{d.item}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setOpen(o => !o)}
          className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
          <span>{open ? '▲' : '▼'}</span>
          {open ? '收起建議' : `查看 ${data.suggestions.length} 項建議`}
        </button>
        {open && (
          <ul className="mt-3 space-y-2">
            {data.suggestions.map((s2, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                <span className="text-xs text-gray-600 leading-relaxed">{s2}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const MSGS = [
  '正在讀取網頁內容…',
  '分析 SEO 結構標籤…',
  '偵測 AEO 問答優化…',
  '評估 GEO 生成引擎訊號…',
  '計算分數與建議中…',
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [loadMsg, setLoadMsg] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const analyze = async () => {
    const trimmed = url.trim();
    if (!trimmed) { setError('請輸入網址'); return; }
    if (!/^https?:\/\/.+/.test(trimmed)) { setError('請輸入有效的 http/https 網址'); return; }

    setError(''); setResult(null); setLoading(true);
    let idx = 0;
    setLoadMsg(MSGS[0]);
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % MSGS.length;
      setLoadMsg(MSGS[idx]);
    }, 2200);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      clearInterval(intervalRef.current);
      if (!res.ok || data.error) throw new Error(data.error || '分析失敗');

      const final: AnalysisResult = {
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        analyzedAt: new Date().toISOString(),
      };
      setResult(final);
      saveToHistory(final);
    } catch (e: unknown) {
      clearInterval(intervalRef.current);
      setError((e instanceof Error ? e.message : '') || '分析失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handlePdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    await exportToPdf(result);
    setPdfLoading(false);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">網址優化分析</h1>
        <p className="text-gray-500 text-sm">輸入網址，自動偵測 SEO・AEO・GEO 優化程度，滿分 100 分，及格線 60 分</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex gap-3">
          <input type="url" value={url}
            onChange={e => { setUrl(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && analyze()}
            placeholder="https://example.com" disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 transition" />
          <button onClick={analyze} disabled={loading}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 disabled:opacity-50 transition flex items-center gap-2">
            {loading
              ? <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
              : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" /></svg>
            }
            {loading ? '分析中' : '分析'}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">{loadMsg}</p>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-blue-400 rounded-full slide-animation" />
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-5 animate-slide-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">分析結果</p>
                <h2 className="font-semibold text-gray-900">{result.site_name || result.url}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{result.url}</p>
              </div>
              <button onClick={handlePdf} disabled={pdfLoading}
                className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1={12} y1={15} x2={12} y2={3}/></svg>
                {pdfLoading ? '產生中…' : '匯出 PDF'}
              </button>
            </div>
            <div className="mb-1 flex justify-between text-xs text-gray-400">
              <span>綜合分數</span>
              <span className={result.overall_score >= PASS ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                {result.overall_score} / 100
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${result.overall_score}%`, background: result.overall_score >= PASS ? '#1D9E75' : '#E24B4A' }} />
            </div>
            <p className="text-right text-[10px] text-gray-400 mt-1">及格線 {PASS} 分</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(['seo', 'aeo', 'geo'] as const).map((key, i) => (
              <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm py-6 flex justify-center">
                <CircleScore score={result[key].score} label={key.toUpperCase()}
                  color={(['blue', 'teal', 'purple'] as const)[i]} />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <ScoreCard label="SEO — 搜尋引擎優化" color="blue" data={result.seo} />
            <ScoreCard label="AEO — 答案引擎優化" color="teal" data={result.aeo} />
            <ScoreCard label="GEO — 生成引擎優化" color="purple" data={result.geo} />
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-xl p-5">
            <p className="text-xs font-semibold text-blue-700 mb-2">💡 整體建議摘要</p>
            <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
          </div>

          <button onClick={() => { setResult(null); setUrl(''); }}
            className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-xl transition">
            重新分析
          </button>
        </div>
      )}
    </div>
  );
}