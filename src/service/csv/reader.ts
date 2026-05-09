import {
  detectBankFormat,
  ParsedTransaction,
  parseTransactionAmount,
  parseTransactionDate,
} from './parser';

// Normalize Danish characters to ASCII equivalents - handle both normal and corrupted characters
function normalizeDanishChars(str: string): string {
  // Replace both the normal characters AND the corrupted/replacement character
  return str
    .replace(/ø/gi, 'oe')           // Normal ø/Ø
    .replace(/å/gi, 'aa')           // Normal å/Å
    .replace(/æ/gi, 'ae')           // Normal æ/Æ
    .replace(/[\uFFFD]/g, 'oe');    // Unicode replacement character (corrupted UTF-8)
}

// Restore corrupted Danish characters in text for display
function restoreCorruptedText(text: string | undefined): string | undefined {
  if (!text) return text;
  // Replace the replacement character with the most likely original character
  return text.replace(/[\uFFFD]/g, 'ø');
}

export async function parseCSVFile(file: File): Promise<ParsedTransaction[]> {
  // Read file as ArrayBuffer and decode explicitly as UTF-8 to preserve Danish characters
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(buffer);
  const lines = text.split('\n');

  if (lines.length < 2) {
    return [];
  }

  // Detect delimiter (comma or tab)
  const delimiter = detectDelimiter(lines[0]);

  // Parse header row to get actual column names
  const headerLine = lines[0];
  const headerNames = parseCSVLineToArray(headerLine, delimiter);

  // Normalize headers for format detection (trim, lowercase, and normalize Danish chars)
  // Note: detectBankFormat will do the normalization, so pass original headerNames
  const format = detectBankFormat(headerNames);

  // For accessing row values by index, we need normalized headers
  const normalizedHeaders = headerNames.map(h =>
    normalizeDanishChars(h.trim().toLowerCase())
  );

  // Use matched indices directly - these are the column positions found during format detection
  // For Danske export: 'dato' -> dateColumn, 'beløb' -> amountColumn, 'tekst' -> merchantColumn
  let dateColumnIndex = -1;
  let amountColumnIndex = -1;
  let merchantColumnIndex = -1;
  let descriptionColumnIndex = -1;
  let currencyColumnIndex = -1;
  let typeColumnIndex = -1;

  if (format.matchedIndices) {
    // Map pattern names to semantic columns for Danske export
    if (format.name.includes('Danske Bank (Detailed Export)')) {
      dateColumnIndex = format.matchedIndices['dato'] ?? -1;
      amountColumnIndex = format.matchedIndices['beloeb'] ?? -1; // Normalized: beløb → beloeb
      merchantColumnIndex = format.matchedIndices['tekst'] ?? -1;
      // Description is also 'tekst'
      descriptionColumnIndex = format.matchedIndices['tekst'] ?? -1;
      currencyColumnIndex = normalizedHeaders.findIndex(h => h.includes('valuta'));
      typeColumnIndex = format.matchedIndices['type'] ?? -1;
    } else if (format.name.includes('Danske Bank')) {
      dateColumnIndex = format.matchedIndices['dato'] ?? -1;
      amountColumnIndex = format.matchedIndices['beloeb'] ?? -1;
      merchantColumnIndex = format.matchedIndices['modtager'] ?? -1;
      descriptionColumnIndex = format.matchedIndices['beskrivelse'] ?? -1;
      typeColumnIndex = format.matchedIndices['type'] ?? -1;
    } else if (format.name.includes('Nordea')) {
      dateColumnIndex = format.matchedIndices['transaktionsdato'] ?? -1;
      amountColumnIndex = format.matchedIndices['beloeb'] ?? -1;
      merchantColumnIndex = format.matchedIndices['modpart'] ?? -1;
      descriptionColumnIndex = format.matchedIndices['tekst'] ?? -1;
    } else if (format.name.includes('Revolut')) {
      dateColumnIndex = format.matchedIndices['Completed Date'] ?? -1;
      amountColumnIndex = format.matchedIndices['Amount'] ?? -1;
      merchantColumnIndex = format.matchedIndices['Merchant'] ?? -1;
      descriptionColumnIndex = format.matchedIndices['Description'] ?? -1;
    } else if (format.name.includes('Wise')) {
      dateColumnIndex = format.matchedIndices['Date'] ?? -1;
      amountColumnIndex = format.matchedIndices['Amount'] ?? -1;
      merchantColumnIndex = format.matchedIndices['Recipient'] ?? -1;
      descriptionColumnIndex = format.matchedIndices['Description'] ?? -1;
    } else {
      // Generic format - use the generic keys
      dateColumnIndex = format.matchedIndices['date'] ?? -1;
      amountColumnIndex = format.matchedIndices['amount'] ?? -1;
      merchantColumnIndex = format.matchedIndices['merchant'] ?? -1;
      descriptionColumnIndex = format.matchedIndices['description'] ?? -1;
      currencyColumnIndex = format.matchedIndices['currency'] ?? -1;
    }
  }

  // Parse transactions
  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    try {
      const rowValues = parseCSVLineToArray(line, delimiter);

      // Access row values by index (avoids corrupted character key lookups)
      const dateStr = rowValues[dateColumnIndex];
      const amountStr = rowValues[amountColumnIndex];
      const merchantStr = rowValues[merchantColumnIndex];
      const typeStr = typeColumnIndex >= 0 ? rowValues[typeColumnIndex] : '';

      // Validate required fields exist
      if (!dateStr || !amountStr || !merchantStr) {
        continue;
      }

      const { amount, type } = parseTransactionAmount(amountStr, typeStr);
      const transactionDate = parseTransactionDate(dateStr);

      // Extract merchant name - handle formats like "Forretning: MCDHILLEROD ..."
      let merchantName = merchantStr;
      if (merchantName && merchantName.includes(':')) {
        // For Danske Export format, extract the part after the colon
        const parts = merchantName.split(':');
        const afterColon = parts[1]?.trim() || '';
        // Get first meaningful word
        merchantName = afterColon.split(/[\s]+/)[0] || merchantName;
      }
      // Restore corrupted Danish characters in merchant name and lowercase
      merchantName = (restoreCorruptedText(merchantName) || '').toLowerCase();

      let description = descriptionColumnIndex >= 0 ? rowValues[descriptionColumnIndex] : undefined;
      // Restore corrupted Danish characters in description and lowercase
      description = restoreCorruptedText(description)?.toLowerCase();

      const currency = currencyColumnIndex >= 0 ? rowValues[currencyColumnIndex] : 'DKK';

      transactions.push({
        transactionDate,
        merchantName,
        amount: type === 'debit' ? -amount : amount,
        description,
        currency,
        type,
      });
    } catch (error) {
      console.error(`Error parsing line ${i}:`, error);
      continue;
    }
  }

  return transactions;
}

function detectDelimiter(headerLine: string): string {
  // Count tabs, commas, and semicolons (excluding those in quotes)
  let tabCount = 0;
  let commaCount = 0;
  let semicolonCount = 0;
  let inQuotes = false;

  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (char === '\t') {
        tabCount++;
      } else if (char === ',') {
        commaCount++;
      } else if (char === ';') {
        semicolonCount++;
      }
    }
  }

  // Return the delimiter with the highest count
  if (semicolonCount > tabCount && semicolonCount > commaCount) {
    return ';';
  }
  if (tabCount > commaCount) {
    return '\t';
  }
  return ',';
}

function parseCSVLineToArray(line: string, delimiter: string = ','): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
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
