import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `你是一位資深的 SEO、AEO（Answer Engine Optimization）、GEO（Generative Engine Optimization）專家分析師。
用戶會提供一個網址，請根據以下標準嚴格評分，並回傳 JSON 格式（只回傳 JSON，不要有其他文字）：

{
  "url": "分析的網址",
  "site_name": "網站名稱",
  "overall_score": 75,
  "seo": {
    "score": 80,
    "details": [
      {"item": "Title 標籤優化", "pass": true},
      {"item": "Meta Description 完整", "pass": false},
      {"item": "H1/H2 標題結構", "pass": true},
      {"item": "結構化資料 Schema", "pass": false},
      {"item": "行動裝置友善", "pass": true},
      {"item": "網址語意化", "pass": true}
    ],
    "suggestions": ["建議1", "建議2"]
  },
  "aeo": {
    "score": 60,
    "details": [
      {"item": "FAQ 問答區塊", "pass": false},
      {"item": "精選摘要段落優化", "pass": true},
      {"item": "問句式內容佈局", "pass": false},
      {"item": "FAQ Schema 標記", "pass": false},
      {"item": "E-E-A-T 權威訊號", "pass": true}
    ],
    "suggestions": ["建議1", "建議2"]
  },
  "geo": {
    "score": 55,
    "details": [
      {"item": "作者資訊與可信度", "pass": false},
      {"item": "原創數據與研究引用", "pass": true},
      {"item": "外部權威來源引用", "pass": false},
      {"item": "主題覆蓋深度", "pass": true},
      {"item": "內容可被 AI 引用性", "pass": false}
    ],
    "suggestions": ["建議1", "建議2", "建議3"]
  },
  "summary": "整體摘要文字..."
}`;

async function callGroq(url: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('未設定 GROQ_API_KEY');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `請分析這個網址的 SEO、AEO、GEO 表現，根據網址推斷該網站的內容與結構來評分：${url}` }
      ],
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });

  const data = await res.json();
  console.log('Groq 回應狀態:', res.status);

  if (!res.ok || data.error) {
    console.error('Groq 錯誤:', JSON.stringify(data.error));
    throw new Error(data.error?.message || 'Groq API 錯誤');
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('無法取得分析結果');
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || !/^https?:\/\/.+/.test(url.trim())) {
      return NextResponse.json({ error: '請輸入有效的網址' }, { status: 400 });
    }

    const raw = await callGroq(url.trim());
    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('回傳格式異常');

    const parsed = JSON.parse(clean.slice(start, end + 1));
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '分析失敗';
    console.error('POST 錯誤:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}