/**
 * FileParserService - Parsea archivos bancarios (CSV, OFX, QFX, PDF)
 *
 * Soporta múltiples formatos de archivos bancarios.
 * Para PDF delega al parser pdfjs-dist en src/lib/pdf-parser.ts.
 */

import { parseBankPDF } from '../../lib/pdf-parser';

export interface ParsedTransaction {
  date: string; // ISO-8601 format
  description: string;
  amount: number;
  balance?: number;
}

export interface ParseResult {
  format: 'CSV' | 'OFX' | 'QFX' | 'PDF';
  transactions: ParsedTransaction[];
  errors: string[];
}

export class FileParserService {

  /**
   * Detecta automáticamente el formato del archivo
   */
  static detectFormat(content: string, fileName?: string): 'CSV' | 'OFX' | 'QFX' | 'PDF' | 'UNKNOWN' {
    // PDF detection — by filename extension or binary magic bytes (%PDF)
    if (fileName?.toLowerCase().endsWith('.pdf') || content.startsWith('%PDF')) {
      return 'PDF';
    }

    // OFX/QFX detection (XML-based)
    if (content.includes('<OFX>') || content.includes('OFXHEADER')) {
      if (content.includes('QUICKEN')) {
        return 'QFX';
      }
      return 'OFX';
    }

    // CSV detection (has commas or semicolons)
    if (content.includes(',') || content.includes(';')) {
      return 'CSV';
    }

    return 'UNKNOWN';
  }

  /**
   * Valida el tamaño del archivo (max 10MB)
   */
  static validateFileSize(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  }

  /**
   * Parsea un archivo bancario
   */
  static async parseFile(file: File): Promise<ParseResult> {
    // Validate file size
    if (!this.validateFileSize(file)) {
      return {
        format: 'CSV',
        transactions: [],
        errors: ['El archivo excede el tamaño máximo de 10MB']
      };
    }

    // --- PDF: direct routing before generic text read ---
    if (file.name.toLowerCase().endsWith('.pdf')) {
      return this.parsePDF(file);
    }

    // Read file content
    const content = await file.text();

    // Detect format (pass filename for better detection)
    const format = this.detectFormat(content, file.name);

    if (format === 'UNKNOWN') {
      return {
        format: 'CSV',
        transactions: [],
        errors: ['Formato de archivo no soportado. Use CSV, OFX, QFX o PDF.']
      };
    }

    // Parse based on format
    switch (format) {
      case 'CSV':
        return this.parseCSV(content);
      case 'OFX':
        return this.parseOFX(content);
      case 'QFX':
        return this.parseQFX(content);
      case 'PDF':
        return this.parsePDF(file);
      default:
        return {
          format: 'CSV',
          transactions: [],
          errors: ['Formato no soportado']
        };
    }
  }

  /**
   * Parsea archivo PDF bancario.
   *
   * Delega a parseBankPDF en src/lib/pdf-parser.ts, que utiliza
   * pdfjs-dist con file.arrayBuffer() para extraer texto real del PDF —
   * incluyendo PDFs de Bank of America (eStmt_*.pdf).
   *
   * Nota de conversión: NormalizedTransaction.amount viene en centavos
   * (p.ej. 1050 = $10.50). El pipeline de ImportTransaction espera dólares
   * flotantes, por lo que dividimos por 100.
   */
  private static async parsePDF(file: File): Promise<ParseResult> {
    try {
      const result = await parseBankPDF(file);
      const rawItems = result.data ?? result.transactions ?? [];

      if (rawItems.length === 0) {
        return {
          format: 'PDF',
          transactions: [],
          errors: ['El PDF no contiene transacciones detectables. Verificá que el archivo sea un estado de cuenta bancario con capa de texto.']
        };
      }

      // Convertir NormalizationResult[] → ParsedTransaction[]
      // amount viene en centavos enteros — convertir a dólares
      const transactions: ParsedTransaction[] = rawItems
        .filter(r => r.success && r.data)
        .map(r => ({
          date: r.data!.transaction_date,
          description: r.data!.description,
          amount: r.data!.amount / 100, // centavos → dólares
          balance: r.data!.metadata?.extracted_balance
            ? parseFloat(String(r.data!.metadata.extracted_balance).replace(/[$,]/g, ''))
            : undefined
        }));

      const errors: string[] = [];
      if (result.bankName) {
        console.info(`[FileParserService] PDF detectado: ${result.bankName}`);
      }
      if (transactions.length < rawItems.length) {
        errors.push(`${rawItems.length - transactions.length} líneas no pudieron normalizarse y fueron omitidas.`);
      }

      return { format: 'PDF', transactions, errors };

    } catch (err) {
      console.error('[FileParserService] parsePDF error:', err);
      return {
        format: 'PDF',
        transactions: [],
        errors: [`Error al procesar el PDF: ${(err as Error).message}`]
      };
    }
  }

  /**
   * Parsea archivo CSV
   */
  private static parseCSV(content: string): ParseResult {
    const errors: string[] = [];
    const transactions: ParsedTransaction[] = [];

    try {
      // Detect delimiter
      const delimiter = this.detectDelimiter(content);

      // Split into lines
      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        return { format: 'CSV', transactions: [], errors: ['Archivo vacío'] };
      }

      // Detect header row
      const headerIndex = this.detectHeaderRow(lines, delimiter);
      const headers = lines[headerIndex].split(delimiter).map(h => h.trim().toLowerCase());

      // Map columns
      const dateCol = this.findColumn(headers, ['date', 'fecha', 'transaction date', 'posting date']);
      const descCol = this.findColumn(headers, ['description', 'descripcion', 'memo', 'details']);
      const amountCol = this.findColumn(headers, ['amount', 'monto', 'value', 'transaction amount']);
      const balanceCol = this.findColumn(headers, ['balance', 'saldo', 'running balance']);

      if (dateCol === -1 || descCol === -1 || amountCol === -1) {
        return {
          format: 'CSV',
          transactions: [],
          errors: ['No se pudieron detectar las columnas requeridas (fecha, descripción, monto)']
        };
      }

      // Parse data rows
      for (let i = headerIndex + 1; i < lines.length; i++) {
        try {
          const cols = this.splitCSVLine(lines[i], delimiter);

          if (cols.length < Math.max(dateCol, descCol, amountCol) + 1) {
            continue; // Skip incomplete rows
          }

          const date = this.parseDate(cols[dateCol]);
          const description = cols[descCol].trim();
          const amount = this.parseAmount(cols[amountCol]);
          const balance = balanceCol !== -1 ? this.parseAmount(cols[balanceCol]) : undefined;

          if (date && description && !isNaN(amount)) {
            transactions.push({ date, description, amount, balance });
          }
        } catch (e) {
          errors.push(`Error en línea ${i + 1}: ${(e as Error).message}`);
        }
      }

      return { format: 'CSV', transactions, errors };

    } catch (e) {
      return {
        format: 'CSV',
        transactions: [],
        errors: [`Error al parsear CSV: ${(e as Error).message}`]
      };
    }
  }

  /**
   * Parsea archivo OFX
   */
  private static parseOFX(content: string): ParseResult {
    const errors: string[] = [];
    const transactions: ParsedTransaction[] = [];

    try {
      // Extract STMTTRN elements (transactions)
      const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
      let match;

      while ((match = stmtTrnRegex.exec(content)) !== null) {
        try {
          const trn = match[1];

          // Extract fields
          const dateMatch = trn.match(/<DTPOSTED>(\d{8})/);
          const amountMatch = trn.match(/<TRNAMT>([-\d.]+)/);
          const descMatch = trn.match(/<NAME>(.*?)(?:<|$)/);
          const memoMatch = trn.match(/<MEMO>(.*?)(?:<|$)/);

          if (dateMatch && amountMatch) {
            const date = this.parseOFXDate(dateMatch[1]);
            const amount = parseFloat(amountMatch[1]);
            const description = (descMatch?.[1] || memoMatch?.[1] || 'Sin descripción').trim();

            transactions.push({ date, description, amount });
          }
        } catch (e) {
          errors.push(`Error al parsear transacción OFX: ${(e as Error).message}`);
        }
      }

      if (transactions.length === 0) {
        errors.push('No se encontraron transacciones en el archivo OFX');
      }

      return { format: 'OFX', transactions, errors };

    } catch (e) {
      return {
        format: 'OFX',
        transactions: [],
        errors: [`Error al parsear OFX: ${(e as Error).message}`]
      };
    }
  }

  /**
   * Parsea archivo QFX (similar a OFX)
   */
  private static parseQFX(content: string): ParseResult {
    // QFX es esencialmente OFX con algunas extensiones de Quicken
    // Usamos el mismo parser
    const result = this.parseOFX(content);
    result.format = 'QFX';
    return result;
  }

  /**
   * Detecta el delimitador del CSV
   */
  private static detectDelimiter(content: string): string {
    const firstLine = content.split('\n')[0];
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;

    if (tabs > commas && tabs > semicolons) return '\t';
    if (semicolons > commas) return ';';
    return ',';
  }

  /**
   * Detecta la fila de encabezados
   */
  private static detectHeaderRow(lines: string[], delimiter: string): number {
    // Buscar la primera fila que contenga palabras clave de encabezado
    const keywords = ['date', 'fecha', 'description', 'descripcion', 'amount', 'monto', 'balance', 'saldo'];

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (keywords.some(kw => line.includes(kw))) {
        return i;
      }
    }

    return 0; // Default to first line
  }

  /**
   * Encuentra una columna por nombres posibles
   */
  private static findColumn(headers: string[], possibleNames: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      if (possibleNames.some(name => header.includes(name))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Divide una línea CSV respetando comillas
   */
  private static splitCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Parsea una fecha en múltiples formatos, incluyendo Bank of America.
   *
   * Soporta:
   *   - ISO: YYYY-MM-DD
   *   - MM/DD/YYYY, MM/DD/YY (BofA, Chase)
   *   - DD/MM/YYYY (heurística: día > 12)
   *   - "Jan 31, 2025" / "Jan 31 2025" (BofA eStatement)
   *   - DD-MM-YYYY, DD.MM.YYYY
   */
  private static parseDate(dateStr: string): string | null {
    const cleaned = dateStr.trim().replace(/"/g, '').replace(/,/g, '');

    // ─ ISO: YYYY-MM-DD ────────────────────────────────────────────
    if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
      return cleaned.substring(0, 10);
    }

    // ─ Mes abreviado: "Jan 31 2025" (BofA eStatement) ───────────────
    const MONTHS: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const monthName = cleaned.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{4})/i);
    if (monthName) {
      const month = MONTHS[monthName[1].toLowerCase()];
      const day = monthName[2].padStart(2, '0');
      const year = monthName[3];
      return `${year}-${month}-${day}`;
    }

    // ─ Numérico con separadores / - . ────────────────────────────
    const numeric = cleaned.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
    if (numeric) {
      let [, a, b, y] = numeric;
      // Normalizar año de 2 dígitos → 4 dígitos (00-30 → 2000-2030, resto → 19xx)
      if (y.length === 2) {
        y = parseInt(y) <= 30 ? `20${y}` : `19${y}`;
      }
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      // Heurística: si a > 12 debe ser DD/MM, si b > 12 debe ser MM/DD
      if (aNum > 12) {
        // DD/MM/YYYY
        return `${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
      } else {
        // Asumir MM/DD/YYYY (formato BofA/Chase por defecto)
        return `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
      }
    }

    // ─ Fallback: Date nativo ──────────────────────────────────────
    const date = new Date(cleaned);
    if (!isNaN(date.getTime())) {
      return date.toISOString().substring(0, 10);
    }

    return null;
  }

  /**
   * Parsea una fecha OFX (YYYYMMDD)
   */
  private static parseOFXDate(dateStr: string): string {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  /**
   * Parsea un monto
   */
  private static parseAmount(amountStr: string): number {
    // Remove quotes, currency symbols, and spaces
    let cleaned = amountStr.trim().replace(/"/g, '').replace(/[$€£]/g, '').replace(/\s/g, '');

    // Handle parentheses as negative (accounting format)
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      cleaned = '-' + cleaned.substring(1, cleaned.length - 1);
    }

    // Replace comma with period if it's the decimal separator
    // Heuristic: if there's only one comma and it's followed by 2 digits, it's decimal
    const commaMatch = cleaned.match(/,(\d{2})$/);
    if (commaMatch) {
      cleaned = cleaned.replace(',', '.');
    } else {
      // Otherwise, comma is thousands separator
      cleaned = cleaned.replace(/,/g, '');
    }

    return parseFloat(cleaned);
  }
}
