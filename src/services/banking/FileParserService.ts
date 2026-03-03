/**
 * FileParserService - Parsea archivos bancarios (CSV, OFX, QFX)
 * 
 * Soporta múltiples formatos de archivos bancarios y detecta automáticamente
 * el formato basado en el contenido del archivo.
 */

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
   * Estrategia (sin depender de headers):
   *   1. Intenta extraer texto plano del PDF con file.text() (PDFs con capa de texto).
   *   2. Busca patrones: fecha DD/MM/YYYY o MM/DD/YYYY + número decimal → transacción.
   *   3. Si no detecta filas completas, extrae solo los montos como fallback.
   *   4. Log de debug: imprime en consola el texto crudo extraído.
   */
  private static async parsePDF(file: File): Promise<ParseResult> {
    const errors: string[] = [];
    const transactions: ParsedTransaction[] = [];

    // ── 1. Extraer texto plano ──────────────────────────────────────────────
    let rawText = '';
    try {
      rawText = await file.text();
    } catch (e) {
      errors.push(`No se pudo leer el texto del PDF: ${(e as Error).message}`);
    }

    // ── DEBUG LOG ──────────────────────────────────────────────────────────
    // Muestra en consola los primeros 3000 chars del texto extraído del PDF
    // para diagnóstico. Remover cuando el parser esté estable.
    console.group('[FileParserService] PDF DEBUG — Texto extraído');
    console.log('Archivo:', file.name, '| Tamaño:', file.size, 'bytes');
    console.log('Primeros 3000 chars del texto plano:');
    console.log(rawText.substring(0, 3000));
    console.log('Longitud total del texto extraído:', rawText.length);
    console.groupEnd();

    // ── 2. Si el texto es demasiado corto, el PDF es escaneado (imagen) ────
    const isScanned = rawText.length < 200;
    if (isScanned) {
      errors.push(
        'El PDF parece ser un documento escaneado (imagen). Convertí el archivo a CSV/OFX para importarlo, o usá un PDF con capa de texto.'
      );
      return { format: 'PDF', transactions: [], errors };
    }

    // ── 3. Parseo por patrones — sin depender de headers ───────────────────
    //
    // Patrones soportados:
    //   - Fecha: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD.MM.YYYY
    //   - Monto: -1,234.56  |  1.234,56  |  (1234.56)  |  -1234.56
    //
    const DATE_RE = /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
    const AMOUNT_RE = /([+-]?\(?\$?\s?\d{1,3}(?:[,.]\d{3})*(?:[,.]\d{2})\)?)(?!\d)/;

    const lines = rawText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 3);

    for (const line of lines) {
      const dateMatch = line.match(DATE_RE);
      const amountMatch = line.match(AMOUNT_RE);

      if (dateMatch && amountMatch) {
        const parsedDate = this.parseDate(dateMatch[0]);
        const parsedAmount = this.parseAmount(amountMatch[0]);

        if (parsedDate && !isNaN(parsedAmount)) {
          // La descripción es todo lo que queda después de quitar fecha y monto
          const description = line
            .replace(dateMatch[0], '')
            .replace(amountMatch[0], '')
            .replace(/\s{2,}/g, ' ')
            .trim() || 'Transacción detectada';

          transactions.push({ date: parsedDate, description, amount: parsedAmount });
        }
      }
    }

    // ── 4. Fallback: si no encontró filas completas extrae montos solos ─────
    if (transactions.length === 0) {
      console.warn('[FileParserService] PDF: 0 transacciones con patrón fecha+monto. Intentando fallback de montos.');
      const amountsOnly = rawText.match(/([+-]?\d{1,3}(?:[,.]\d{3})*[,.]\d{2})/g);
      if (amountsOnly && amountsOnly.length > 0) {
        amountsOnly.slice(0, 30).forEach((amt, i) => {
          const parsed = this.parseAmount(amt);
          if (!isNaN(parsed) && parsed !== 0) {
            transactions.push({
              date: new Date().toISOString().substring(0, 10),
              description: `Monto extraído #${i + 1} (revisión manual recomendada)`,
              amount: parsed
            });
          }
        });
        errors.push(
          'No se pudieron detectar fechas en el PDF. Los montos fueron extraídos sin fecha — revisá manualmente antes de confirmar.'
        );
      } else {
        errors.push('No se encontraron transacciones en el PDF. Verificá que el archivo tenga capa de texto y no sea una imagen escaneada.');
      }
    }

    return { format: 'PDF', transactions, errors };
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
   * Parsea una fecha en múltiples formatos
   */
  private static parseDate(dateStr: string): string | null {
    const cleaned = dateStr.trim().replace(/"/g, '');

    // Try ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
      return cleaned.substring(0, 10);
    }

    // Try MM/DD/YYYY
    const mmddyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mmddyyyy) {
      const [, month, day, year] = mmddyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Try DD/MM/YYYY
    const ddmmyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      // Heuristic: if day > 12, it's DD/MM/YYYY
      if (parseInt(day) > 12) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // Try parsing with Date
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
