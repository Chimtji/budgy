type TParsedRow = {
  date: string;
  amount: number;
  description: string;
  recipient: string;
  balance: number | null;
  supp_text: string | null;
};

function parseDanishNumber(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.'));
}

function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  if (line.includes(';')) return ';';
  return ',';
}

function isDateLike(value: string): boolean {
  return /\d{2}[.\-/]\d{2}[.\-/]\d{2,4}/.test(value) || /\d{4}-\d{2}-\d{2}/.test(value);
}

function isAmountLike(value: string): boolean {
  const v = value.trim();
  return /^-?[\d.,]+$/.test(v) && (v.includes(',') || v.includes('.')) && parseDanishNumber(v) !== 0;
}

function normalizeDate(value: string): string {
  const ddmmyyyy = value.match(/^(\d{2})[.\-/](\d{2})[.\-/](\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;

  const ddmmyy = value.match(/^(\d{2})[.\-/](\d{2})[.\-/](\d{2})$/);
  if (ddmmyy) return `20${ddmmyy[3]}-${ddmmyy[2]}-${ddmmyy[1]}`;

  return value;
}

// Find first line (up to 10) that looks like a named-column header row
function stripQuotes(value: string): string {
  const t = value.trim();
  return t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t;
}

function findHeaderRow(lines: string[], delimiter: string): number {
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const cols = lines[i].split(delimiter).map((h) => stripQuotes(h).toLowerCase());
    if (cols.some((h) => h === 'dato') && cols.some((h) => h === 'tekst')) {
      return i;
    }
  }
  return -1;
}

// Parse a CSV that has named column headers (Danish bank exports)
function parseWithHeaders(lines: string[], delimiter: string, headerIdx: number): TParsedRow[] {
  const headers = lines[headerIdx].split(delimiter).map((h) => stripQuotes(h).toLowerCase());

  const col = (name: string) => headers.indexOf(name);

  const colDato = col('dato');
  const colTekst = col('tekst');
  // 'beløb' may not match due to encoding; fall back to column after 'tekst'
  const colBelob = (() => {
    const exact = headers.findIndex((h) => h === 'beløb' || h === 'belob');
    return exact !== -1 ? exact : colTekst + 1;
  })();
  const colSaldo = col('saldo');
  const colIndbetaler = col('indbetaler');
  const colModtagernavn = col('modtagernavn');
  const colModtager = headers.findIndex((h) => h === 'modtager'); // exact — excludes 'modtagerkonto'
  const colSuppTekst = headers.findIndex((h) => h === 'supp. tekst til modtager');

  const rows: TParsedRow[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(delimiter).map((c) => stripQuotes(c));

    const dateRaw = cols[colDato] ?? '';
    if (!isDateLike(dateRaw)) continue;

    const amountRaw = cols[colBelob] ?? '';
    const amount = parseDanishNumber(amountRaw);
    if (isNaN(amount)) continue;

    const tekst = cols[colTekst] ?? '';
    const suppRaw = colSuppTekst !== -1 ? (cols[colSuppTekst] ?? '') : '';
    const balanceRaw = colSaldo !== -1 ? (cols[colSaldo] ?? '') : '';
    const indbetaler = colIndbetaler !== -1 ? (cols[colIndbetaler] ?? '') : '';
    const modtagernavn = colModtagernavn !== -1 ? (cols[colModtagernavn] ?? '') : '';
    const modtager = colModtager !== -1 ? (cols[colModtager] ?? '') : '';

    // Build full description from tekst + supplementary text
    let description: string;
    if (suppRaw && suppRaw.toLowerCase().startsWith(tekst.toLowerCase())) {
      description = suppRaw;
    } else if (suppRaw) {
      description = tekst ? `${tekst} – ${suppRaw}` : suppRaw;
    } else {
      description = tekst;
    }

    const recipient = modtager || modtagernavn || indbetaler || tekst;
    const balance = balanceRaw ? (parseDanishNumber(balanceRaw) || null) : null;
    const supp_text = suppRaw || null;

    rows.push({ date: normalizeDate(dateRaw), amount, description, recipient, balance, supp_text });
  }

  return rows;
}

// Fallback: detect columns by scanning data rows for date/amount patterns
function parseGeneric(lines: string[], delimiter: string): TParsedRow[] {
  if (lines.length < 2) return [];

  const rows: TParsedRow[] = [];
  let dateIdx = -1;
  let amountIdx = -1;
  let descIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    if (cols.length < 2) continue;
    for (let j = 0; j < cols.length; j++) {
      if (dateIdx === -1 && isDateLike(cols[j])) dateIdx = j;
      if (amountIdx === -1 && isAmountLike(cols[j])) amountIdx = j;
    }
    if (dateIdx !== -1 && amountIdx !== -1) break;
  }

  const headers = lines[0].split(delimiter).map((h) => stripQuotes(h).toLowerCase());
  for (let j = 0; j < headers.length; j++) {
    if (j !== dateIdx && j !== amountIdx) { descIdx = j; break; }
  }

  const startRow = isDateLike(lines[0].split(delimiter)[dateIdx] ?? '') ? 0 : 1;

  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(delimiter).map((c) => stripQuotes(c));
    if (dateIdx === -1 || amountIdx === -1 || cols.length <= Math.max(dateIdx, amountIdx)) continue;

    const rawDate = cols[dateIdx];
    if (!isDateLike(rawDate)) continue;

    const amount = parseDanishNumber(cols[amountIdx]);
    if (isNaN(amount)) continue;

    const description = descIdx !== -1 ? cols[descIdx] : '';
    rows.push({ date: normalizeDate(rawDate), amount, description, recipient: description, balance: null, supp_text: null });
  }

  return rows;
}

export function parseCSV(content: string): TParsedRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headerIdx = findHeaderRow(lines, delimiter);

  if (headerIdx !== -1) return parseWithHeaders(lines, delimiter, headerIdx);

  return parseGeneric(lines, delimiter);
}
