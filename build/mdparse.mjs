// mdparse.mjs — shared markdown -> parts parser for the Shipyard pipeline
export function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
export function inline(t) {
  return esc(t)
    .replace(/`([^`]+)`/g, '<code class="inline">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
export function term(lang, code) {
  const lines = code.split('\n');
  const body = lines.map(l => {
    const t = l.trim();
    if (!t) return '';
    if (t.startsWith('#')) return '<span class="c">' + esc(l) + '</span>';
    if (/^\$/.test(t) || /^\d+\.\s/.test(t)) return '<span class="a">' + esc(l) + '</span>';
    return esc(l);
  }).join('\n');
  return '<div class="term"><div class="termhead"><span class="td td1"></span><span class="td td2"></span><span class="td td3"></span><span class="tname">' + esc(lang) + '</span><button class="copybtn">COPY</button></div><pre><code>' + body + '</code></pre></div>';
}

// ================= markdown -> parts =================
export function parse(md) {
  const lines = md.split(/\r?\n/);
  const parts = []; let cur = null; let inFence = false; let fenceBuf = []; let fenceLang = '';
  let tblBuf = []; let quoteBuf = [];

  function flushTable() {
    if (!tblBuf.length) return;
    const rows = tblBuf.map(r => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim()));
    let html = '<div class="tblwrap"><table>';
    if (rows.length > 1 && /^:?-+:?$/.test(rows[1][0] || '')) {
      html += '<thead><tr>' + rows[0].map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
      rows.splice(0, 2);
    } else {
      html += '<tbody>';
    }
    rows.forEach(r => { html += '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>'; });
    cur.body.push(html + '</tbody></table></div>');
    tblBuf = [];
  }
  function flushQuote() {
    if (!quoteBuf.length) return;
    let text = quoteBuf.join(' ').replace(/\s+/g, ' ').trim();
    let lbl = 'THE SHIPYARD\'S WORD';
    const lblm = text.match(/^\*\*([^*]+):\*\*[\s\S]*/);
    if (lblm) { lbl = lblm[1]; text = text.replace(/^\*\*([^*]+):\*\*/, '').trim(); }
    cur.body.push('<div class="idea"><span class="lbl">' + esc(lbl.toUpperCase()) + '</span><p>' + inline(text) + '</p></div>');
    quoteBuf = [];
  }

  for (const raw of lines) {
    const l = raw;
if (inFence) {
if (/^```/.test(l)) { inFence = false; cur.body.push(term(fenceLang, fenceBuf.join('\n'))); fenceBuf = []; continue; }
fenceBuf.push(l); continue;
    }
    if (/^```/.test(l)) { flushTable(); flushQuote(); if (!cur) continue; inFence = true; fenceLang = (l.match(/^```\s*(\S+)/) || [])[1] || 'terminal'; continue; }
    const hl = l.trim();
    if (/^## Part (\d+)\s*[-—–]\s*(.+)$/.test(hl)) {
      flushTable(); flushQuote();
      const m = hl.match(/^## Part (\d+)\s*[-—–]\s*(.+)$/);
      const titleRaw = m[2];
      const tagm = titleRaw.match(/\[([A-Z]+)(?:\s*[^\]]*)?\]\s*$/);
      const tag = tagm ? tagm[1] : null;
      const title = tagm ? titleRaw.replace(/\s*\[[^\]]*\]\s*$/, '') : titleRaw;
      cur = { id: 'p' + m[1], num: m[1].padStart(2, '0'), title, tag, body: [] };
      parts.push(cur); continue;
    }
    if (!cur) continue;
    if (cur.id === 'p0') continue; // p0 prose is chrome; not rendered
    if (/^### /.test(hl)) { flushTable(); flushQuote(); cur.body.push('<h2>' + inline(hl.replace(/^### /, '')) + '</h2>'); continue; }
    if (/^# /.test(hl)) continue;
    if (/^---+$/.test(hl)) { flushTable(); flushQuote(); continue; }
    if (/^\|/.test(hl)) { flushQuote(); tblBuf.push(hl); continue; }
    if (/^>/.test(hl)) { flushTable(); quoteBuf.push(hl.replace(/^>\s?/, '')); continue; }
    flushTable();
    if (/^[-*] /.test(hl)) { flushQuote(); cur.body.push('<ul><li>' + inline(hl.replace(/^[-*] /, '')) + '</li></ul>'); continue; }
    if (/^\d+\. /.test(hl)) { flushQuote(); cur.body.push('<ol><li>' + inline(hl.replace(/^\d+\. /, '')) + '</li></ol>'); continue; }
    if (hl === '') { flushQuote(); continue; }
    if (hl.startsWith('**') || hl.length) { flushQuote(); cur.body.push('<p>' + inline(hl) + '</p>'); }
  }
  flushTable(); flushQuote();
  return parts;
}