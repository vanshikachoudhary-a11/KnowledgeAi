export function chunkText(text, { chunkSize = 1200, overlap = 180 } = {}) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);
    if (end < normalized.length) { const boundary = normalized.lastIndexOf('. ', end); if (boundary > start + chunkSize * 0.55) end = boundary + 1; }
    chunks.push(normalized.slice(start, end).trim());
    if (end === normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}
