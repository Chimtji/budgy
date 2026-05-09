export interface ParsedTransaction {
  transactionDate: string;
  merchantName: string;
  amount: number;
  description?: string;
  currency: string;
  type: 'debit' | 'credit';
}

export interface CSVFormat {
  name: string;
  detectPatterns: string[]; // Look for these column names to detect format
  dateColumn: string;
  amountColumn: string;
  descriptionColumn: string;
  merchantColumn: string;
  currencyColumn?: string;
  typeColumn?: string;
  transform?: (row: Record<string, string>) => ParsedTransaction;
  // NEW: Store the indices where patterns were found
  matchedIndices?: Record<string, number>;
}

// Bank-specific formats
// Normalize Danish characters to ASCII equivalents to avoid encoding issues
function normalizeDanishChars(str: string): string {
  // Replace both the normal characters AND the corrupted/replacement character variants
  // Input is already lowercase, so only need lowercase replacements
  return str
    .replace(/ø/g, 'oe')            // Normal ø
    .replace(/å/g, 'aa')            // Normal å
    .replace(/æ/g, 'ae')            // Normal æ
    .replace(/[\uFFFD]/g, 'oe');    // Unicode replacement character (corrupted UTF-8 - usually ø)
}

export const BANK_FORMATS: Record<string, CSVFormat> = {
  danske_export: {
    name: 'Danske Bank (Detailed Export)',
    detectPatterns: ['exportkonto', 'dato', 'tekst', 'beloeb'], // Normalized: beløb → beloeb
    dateColumn: 'Dato',
    amountColumn: 'Beløb',
    descriptionColumn: 'Tekst',
    merchantColumn: 'Tekst', // Use Tekst as merchant source, extract first part
    currencyColumn: 'Valuta',
  },
  danske: {
    name: 'Danske Bank',
    detectPatterns: ['dato', 'beloeb', 'beskrivelse', 'modtager'], // All normalized to ASCII
    dateColumn: 'Dato',
    amountColumn: 'Beløb',
    descriptionColumn: 'Beskrivelse',
    merchantColumn: 'Modtager',
    currencyColumn: 'Valuta',
    typeColumn: 'Type',
  },
  nordea: {
    name: 'Nordea',
    detectPatterns: ['transaktionsdato', 'beloeb', 'tekst', 'modpart'],
    dateColumn: 'Transaktionsdato',
    amountColumn: 'Beløb',
    descriptionColumn: 'Tekst',
    merchantColumn: 'Modpart',
    currencyColumn: 'Valuta',
  },
  revolut: {
    name: 'Revolut',
    detectPatterns: ['Completed Date', 'Amount', 'Description', 'Merchant'],
    dateColumn: 'Completed Date',
    amountColumn: 'Amount',
    descriptionColumn: 'Description',
    merchantColumn: 'Merchant',
    currencyColumn: 'Currency',
  },
  wise: {
    name: 'Wise',
    detectPatterns: ['Date', 'Amount', 'Description', 'Recipient'],
    dateColumn: 'Date',
    amountColumn: 'Amount',
    descriptionColumn: 'Description',
    merchantColumn: 'Recipient',
    currencyColumn: 'Currency',
  },
  generic: {
    name: 'Generic (Auto-detect)',
    detectPatterns: [],
    dateColumn: '',
    amountColumn: '',
    descriptionColumn: '',
    merchantColumn: '',
  },
};

export function detectBankFormat(headers: string[]): CSVFormat {
  const lowerHeaders = headers.map((h) =>
    normalizeDanishChars(h.toLowerCase().trim())
  );

  // Try to match each bank format
  for (const [key, format] of Object.entries(BANK_FORMATS)) {
    if (key === 'generic') continue;

    const matches = format.detectPatterns.map((pattern) =>
      lowerHeaders.some((h) => h.includes(normalizeDanishChars(pattern.toLowerCase())))
    );

    if (matches.filter(Boolean).length >= format.detectPatterns.length * 0.7) {
      // Build index map: for each pattern, find its index in the normalized header
      const matchedIndices: Record<string, number> = {};
      format.detectPatterns.forEach((pattern) => {
        const normalizedPattern = normalizeDanishChars(pattern.toLowerCase());
        const idx = lowerHeaders.findIndex(h => h.includes(normalizedPattern));
        if (idx >= 0) {
          matchedIndices[pattern] = idx;
        }
      });

      // Return format with matched indices
      return {
        ...format,
        matchedIndices,
        dateColumn: format.dateColumn.toLowerCase().trim(),
        amountColumn: format.amountColumn.toLowerCase().trim(),
        descriptionColumn: format.descriptionColumn.toLowerCase().trim(),
        merchantColumn: format.merchantColumn.toLowerCase().trim(),
        currencyColumn: format.currencyColumn ? format.currencyColumn.toLowerCase().trim() : undefined,
        typeColumn: format.typeColumn ? format.typeColumn.toLowerCase().trim() : undefined,
      };
    }
  }

  // Fallback: auto-detect columns by name similarity
  return detectGenericFormat(headers);
}

function detectGenericFormat(headers: string[]): CSVFormat {
  const lowerHeaders = headers.map((h) => normalizeDanishChars(h.toLowerCase()));

  const findColumn = (keywords: string[]): string => {
    const match = lowerHeaders.find((h) =>
      keywords.some((k) => h.includes(normalizeDanishChars(k.toLowerCase())))
    );
    return match || '';
  };

  const findColumnIndex = (keywords: string[]): number => {
    return lowerHeaders.findIndex((h) =>
      keywords.some((k) => h.includes(normalizeDanishChars(k.toLowerCase())))
    );
  };

  // Build matched indices for generic format too
  const matchedIndices: Record<string, number> = {};
  matchedIndices['date'] = findColumnIndex(['date', 'dato', 'transaction', 'transaktions']);
  matchedIndices['amount'] = findColumnIndex(['amount', 'beloeb', 'sum']);
  matchedIndices['description'] = findColumnIndex(['description', 'beskrivelse', 'tekst', 'text']);
  matchedIndices['merchant'] = findColumnIndex(['merchant', 'modtager', 'recipient', 'sender', 'modpart']);
  matchedIndices['currency'] = findColumnIndex(['currency', 'valuta']);

  return {
    name: 'Generic (Auto-detected)',
    detectPatterns: [],
    dateColumn: findColumn(['date', 'dato', 'transaction', 'transaktions']),
    amountColumn: findColumn(['amount', 'beloeb', 'sum']),
    descriptionColumn: findColumn(['description', 'beskrivelse', 'tekst', 'text']),
    merchantColumn: findColumn(['merchant', 'modtager', 'recipient', 'sender', 'modpart']),
    currencyColumn: findColumn(['currency', 'valuta']),
    matchedIndices,
  };
}

export function parseCSVLine(line: string): Record<string, string> {
  // Handle quoted fields with commas inside
  const result: Record<string, string> = {};
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return result;
}

export function parseTransactionAmount(
  amountStr: string,
  type?: string
): { amount: number; type: 'debit' | 'credit' } {
  // Remove currency symbols and spaces
  let cleanAmount = amountStr
    .replace(/[^\d\-,.]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const amount = Math.abs(parseFloat(cleanAmount));

  // Determine type
  let txType: 'debit' | 'credit' = 'debit';
  if (type && type.toLowerCase().includes('credit')) {
    txType = 'credit';
  } else if (type && type.toLowerCase().includes('debit')) {
    txType = 'debit';
  } else if (parseFloat(cleanAmount) > 0) {
    txType = amountStr.includes('-') ? 'debit' : 'credit';
  }

  return { amount, type: txType };
}

export function parseTransactionDate(dateStr: string): string {
  // Try common date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /^(\d{2})\.(\d{2})\.(\d{4})/, // DD.MM.YYYY
    /^(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      // Convert to YYYY-MM-DD
      if (match[1].length === 4) {
        // Already YYYY-MM-DD
        return `${match[1]}-${match[2]}-${match[3]}`;
      } else {
        // DD/MM/YYYY format
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }
  }

  // Fallback: try to parse as ISO date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}
