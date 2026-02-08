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
  format: 'CSV' | 'OFX' | 'QFX';
  transactions: ParsedTransaction[];
  errors: string[];
}

export class FileParserService {
  
  /**
   * Detecta automáticamente el formato del archivo
   */
  static detectFormat(content: string): 'CSV' | 'OFX' | 'QFX' | 'UNKNOWN' {
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
    
    // Read file content
    const content = await file.text();
    
    // Detect format
    const format = this.detectFormat(content);
    
    if (format === 'UNKNOWN') {
      return {
        format: 'CSV',
        transactions: [],
        errors: ['Formato de archivo no soportado. Use CSV, OFX o QFX.']
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
      default:
        return {
          format: 'CSV',
          transactions: [],
          errors: ['Formato no soportado']
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
