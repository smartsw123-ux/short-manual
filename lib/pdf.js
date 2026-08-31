// PDF 텍스트 추출 (unpdf — 서버리스 환경에서 동작하는 순수 JS pdf.js 래퍼)

export async function extractPdfText(arrayBuffer) {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: false });

  // text: 페이지별 문자열 배열
  const pages = Array.isArray(text) ? text : [text];
  const merged = pages
    .map((t, i) => `\n\n===== [P.${i + 1}] =====\n${(t || '').trim()}`)
    .join('');

  return {
    text: merged.trim(),
    pageCount: totalPages || pages.length,
    charCount: merged.trim().length,
  };
}
