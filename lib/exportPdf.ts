import { AnalysisResult } from './types';

export async function exportToPdf(result: AnalysisResult): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PASS = 60;
  const W = 210;
  const MARGIN = 20;
  const contentW = W - MARGIN * 2;

  const hex2rgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });

  const setColor = (hex: string, type: 'fill' | 'text' | 'draw' = 'fill') => {
    const { r, g, b } = hex2rgb(hex);
    if (type === 'fill') doc.setFillColor(r, g, b);
    else if (type === 'text') doc.setTextColor(r, g, b);
    else doc.setDrawColor(r, g, b);
  };

  let y = MARGIN;

  const checkPageBreak = (needed = 20) => {
    if (y + needed > 277) { doc.addPage(); y = MARGIN; }
  };

  setColor('#1a1a2e', 'fill');
  doc.rect(0, 0, W, 40, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setColor('#ffffff', 'text');
  doc.text('SEO · AEO · GEO 分析報告', MARGIN, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setColor('#aaaacc', 'text');
  doc.text(result.url, MARGIN, 26);
  doc.text(`分析日期：${new Date(result.analyzedAt).toLocaleString('zh-TW')}`, MARGIN, 33);
  y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  setColor('#1a1a2e', 'text');
  doc.text(result.site_name || result.url, MARGIN, y);
  y += 10;

  const passed = result.overall_score >= PASS;
  setColor('#f0f0f0', 'fill');
  doc.roundedRect(MARGIN, y, contentW, 14, 3, 3, 'F');
  setColor(passed ? '#1D9E75' : '#E24B4A', 'fill');
  doc.roundedRect(MARGIN, y, contentW * (result.overall_score / 100), 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor('#ffffff', 'text');
  doc.text(`綜合分數 ${result.overall_score} / 100`, MARGIN + 4, y + 9);
  y += 22;

  const cats = [
    { label: 'SEO', data: result.seo, color: '#378ADD', bg: '#E6F1FB', textC: '#0C447C' },
    { label: 'AEO', data: result.aeo, color: '#1D9E75', bg: '#E1F5EE', textC: '#085041' },
    { label: 'GEO', data: result.geo, color: '#7F77DD', bg: '#EEEDFE', textC: '#3C3489' },
  ];
  const boxW = (contentW - 12) / 3;
  cats.forEach((cat, i) => {
    const bx = MARGIN + i * (boxW + 6);
    const catPassed = cat.data.score >= PASS;
    setColor(cat.bg, 'fill');
    doc.roundedRect(bx, y, boxW, 28, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    setColor(catPassed ? cat.color : '#E24B4A', 'text');
    doc.text(String(cat.data.score), bx + boxW / 2, y + 16, { align: 'center' });
    doc.setFontSize(8);
    setColor(cat.textC, 'text');
    doc.text(cat.label, bx + boxW / 2, y + 23, { align: 'center' });
  });
  y += 36;

  cats.forEach((cat) => {
    checkPageBreak(60);
    setColor(cat.bg, 'fill');
    doc.roundedRect(MARGIN, y, contentW, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(cat.textC, 'text');
    doc.text(`${cat.label}（${cat.data.score} 分）`, MARGIN + 4, y + 7);
    y += 14;

    cat.data.details.forEach((d) => {
      checkPageBreak(8);
      const icon = d.pass ? '✓' : '✗';
      const col = d.pass ? '#27500A' : '#791F1F';
      const bgCol = d.pass ? '#EAF3DE' : '#FCEBEB';
      setColor(bgCol, 'fill');
      doc.roundedRect(MARGIN, y - 4, 8, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setColor(col, 'text');
      doc.text(icon, MARGIN + 2.5, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      setColor('#333333', 'text');
      doc.text(d.item, MARGIN + 11, y);
      y += 7;
    });
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor('#444444', 'text');
    doc.text('建議改善項目：', MARGIN, y);
    y += 6;
    cat.data.suggestions.forEach((s) => {
      const lines = doc.splitTextToSize(`• ${s}`, contentW - 6);
      checkPageBreak(lines.length * 5 + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setColor('#555555', 'text');
      doc.text(lines, MARGIN + 4, y);
      y += lines.length * 5 + 2;
    });
    y += 8;
  });

  checkPageBreak(40);
  setColor('#f5f5ff', 'fill');
  doc.roundedRect(MARGIN, y, contentW, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor('#185FA5', 'text');
  doc.text('整體建議摘要', MARGIN + 4, y + 5.5);
  y += 12;
  const sumLines = doc.splitTextToSize(result.summary, contentW - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor('#333333', 'text');
  doc.text(sumLines, MARGIN + 2, y);

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    setColor('#999999', 'text');
    doc.text(`第 ${p} / ${pageCount} 頁`, W / 2, 290, { align: 'center' });
  }

  const filename = `seo-report-${result.url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-').slice(0, 40)}.pdf`;
  doc.save(filename);
}