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
}

// Bank-specific formats
export const BANK_FORMATS: Record<string, CSVFormat> = {
  danske: {
    name: 'Danske Bank',
    detectPatterns: ['Dato', 'Beløb', 'Beskrivelse', 'Modtager'],
    dateColumn: 'Dato',
    amountColumn: 'Beløb',
    descriptionColumn: 'Beskrivelse',
    merchantColumn: 'Modtager',
    currencyColumn: 'Valuta',
    typeColumn: 'Type',
  },
  nordea: {
    name: 'Nordea',
    detectPatterns: ['Transaktionsdato', 'Beløb', 'Tekst', 'Modpart'],
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
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  // Try to match each bank format
  for (const [key, format] of Object.entries(BANK_FORMATS)) {
    if (key === 'generic') continue;

    const matches = format.detectPatterns.map((pattern) =>
      lowerHeaders.some((h) => h.includes(pattern.toLowerCase()))
    );

    if (matches.filter(Boolean).length >= format.detectPatterns.length * 0.7) {
      return format;
    }
  }

  // Fallback: auto-detect columns by name similarity
  return detectGenericFormat(headers);
}

function detectGenericFormat(headers: string[]): CSVFormat {
  const lowerHeaders = headers.map((h) => h.toLowerCase());

  const findColumn = (keywords: string[]): string => {
    const match = headers.find((h) =>
      keywords.some((k) => h.toLowerCase().includes(k.toLowerCase()))
    );
    return match || '';
  };

  return {
    name: 'Generic (Auto-detected)',
    detectPatterns: [],
    dateColumn: findColumn(['date', 'dato', 'transaction', 'transaktions']),
    amountColumn: findColumn(['amount', 'beløb', 'sum']),
    descriptionColumn: findColumn(['description', 'beskrivelse', 'tekst', 'text']),
    merchantColumn: findColumn(['merchant', 'modtager', 'recipient', 'sender', 'modpart']),
    currencyColumn: findColumn(['currency', 'valuta']),
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
