import {
  detectBankFormat,
  ParsedTransaction,
  parseTransactionAmount,
  parseTransactionDate,
} from './parser';

export async function parseCSVFile(file: File): Promise<ParsedTransaction[]> {
  const text = await file.text();
  const lines = text.split('\n');

  if (lines.length < 2) {
    return [];
  }

  // Parse header row to get actual column names
  const headerLine = lines[0];
  const headerNames = parseCSVLineToArray(headerLine);

  // Detect bank format based on header names
  const format = detectBankFormat(headerNames);

  // Parse transactions
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    try {
      const rowValues = parseCSVLineToArray(line);
      const rowObj = createRowObject(headerNames, rowValues);

      if (
        !rowObj[format.dateColumn] ||
        !rowObj[format.amountColumn] ||
        !rowObj[format.merchantColumn]
      ) {
        continue;
      }

      const dateStr = rowObj[format.dateColumn];
      const amountStr = rowObj[format.amountColumn];
      const typeStr = format.typeColumn ? rowObj[format.typeColumn] : '';

      const { amount, type } = parseTransactionAmount(amountStr, typeStr);
      const transactionDate = parseTransactionDate(dateStr);

      // Extract merchant name - handle formats like "Forretning: MCDHILLEROD ..."
      let merchantName = rowObj[format.merchantColumn];
      if (merchantName && merchantName.includes(':')) {
        // For Danske Export format, extract the part after the colon
        const parts = merchantName.split(':');
        const afterColon = parts[1]?.trim() || '';
        // Get first meaningful word
        merchantName = afterColon.split(/[\s]+/)[0] || merchantName;
      }

      transactions.push({
        transactionDate,
        merchantName,
        amount: type === 'debit' ? -amount : amount,
        description: format.descriptionColumn ? rowObj[format.descriptionColumn] : undefined,
        currency: format.currencyColumn ? rowObj[format.currencyColumn] : 'DKK',
        type,
      });
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
      continue;
    }
  }

  return transactions;
}

function parseCSVLineToArray(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim().replace(/^"|"$/g, ''));

  return fields;
}

function createRowObject(headerNames: string[], values: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  headerNames.forEach((header, idx) => {
    result[header] = values[idx] || '';
  });
  return result;
}
