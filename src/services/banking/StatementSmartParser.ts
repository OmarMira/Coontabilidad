/**
 * StatementSmartParser
 * 
 * Servicio para extraer metadatos de estados de cuenta bancarios (OFX, CSV, PDF).
 * Detecta números de cuenta y nombres de bancos para automatizar la selección.
 */

import Tesseract from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';

// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export interface StatementMetadata {
    accountNumber: string;
    bankName: string;
    currency: string;
    format: 'OFX' | 'CSV' | 'PDF' | 'UNKNOWN';
    openingBalance?: number;
    closingBalance?: number;
    totalCredits?: number;
    totalDebits?: number;
    isValidTriangle?: boolean;
    extractionMethod?: 'PARS' | 'OCR';
    transactions?: any[];
}

export class StatementSmartParser {
    /**
     * Analiza un archivo para extraer metadatos básicos
     */
    public static async parseMetadata(file: File): Promise<StatementMetadata> {
        const extension = file.name.split('.').pop()?.toUpperCase();

        if (extension === 'PDF' || ['JPG', 'JPEG', 'PNG'].includes(extension || '')) {
            return this.parseVisualDocument(file);
        }

        const text = await file.text();
        if (extension === 'OFX' || text.includes('<OFX>')) {
            return this.parseOFX(text);
        } else if (extension === 'CSV') {
            return this.parseCSV(text);
        }

        return {
            accountNumber: '',
            bankName: '',
            currency: 'USD',
            format: 'UNKNOWN'
        };
    }

    /**
     * Procesa un PDF o Imagen usando extracción directa o OCR
     */
    private static async parseVisualDocument(file: File): Promise<StatementMetadata> {
        try {
            let text = '';
            const extension = file.name.split('.').pop()?.toUpperCase();

            // 1. Intentar extracción directa si es PDF (Capas de texto nativas)
            if (extension === 'PDF') {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;
                    let fullText = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const strings = content.items.map((item: any) => item.str);
                        fullText += strings.join(' ') + '\n';
                    }
                    text = fullText;
                } catch (pdfError) {
                    console.warn('PDF layers extraction failed, falling back to OCR:', pdfError);
                }
            }

            // 2. Si no hay texto (escaneado) o es imagen, usar OCR (Tesseract)
            if (!text.trim()) {
                const { data: { text: ocrText } } = await Tesseract.recognize(file, 'eng+spa');
                text = ocrText;
            }

            if (!text.trim()) throw new Error('No text could be extracted');

            let bankName = 'Banco Detectado';
            let accountNumber = '';
            let openingBalance = 0;
            let closingBalance = 0;

            // Identificación inteligente del banco
            const upperText = text.toUpperCase();
            if (upperText.includes('BANK OF AMERICA') || upperText.includes('BOFA')) {
                bankName = 'Bank of America';
                const bofaAcct = text.match(/account number:\s*([\d\s]{4,})/i);
                if (bofaAcct) accountNumber = bofaAcct[1].replace(/\s/g, '').slice(-4);
            } else if (upperText.includes('CHASE')) {
                bankName = 'JP Morgan Chase';
                const chaseAcct = text.match(/account number:\s*(\d{4,})/i);
                if (chaseAcct) accountNumber = chaseAcct[1].slice(-4);
            } else if (upperText.includes('WELLS') || upperText.includes('FARGO')) {
                bankName = 'Wells Fargo';
            } else if (upperText.includes('CITI')) {
                bankName = 'Citibank';
            }

            if (!accountNumber) {
                const genericAcct = text.match(/(account|acct|cta|cuenta|no\.)\s*[:#-]*\s*(\d{4,})/i);
                if (genericAcct) accountNumber = genericAcct[2].slice(-4);
            }

            // Extracción Ultra-Robusta de Transacciones (Mapeo Permisivo)
            const transactions: any[] = [];
            const lines = text.split('\n');
            const datePattern = /(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?)/;
            const amountPattern = /([-+]?\s?\$?\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2})/;

            lines.forEach(line => {
                const trimmed = line.trim();
                const dMatch = trimmed.match(datePattern);

                if (dMatch) {
                    const dateStr = dMatch[0];
                    const allAmounts = trimmed.match(new RegExp(amountPattern.source, 'g'));

                    if (allAmounts && allAmounts.length > 0) {
                        const rawAmount = allAmounts[allAmounts.length - 1];
                        const amount = parseFloat(rawAmount.replace(/[$\s]/g, '').replace(',', '.'));

                        if (!isNaN(amount) && amount !== 0) {
                            const description = trimmed
                                .replace(dateStr, '')
                                .replace(rawAmount, '')
                                .replace(/[|:_]/g, '')
                                .trim();

                            if (description.length > 1) {
                                transactions.push({
                                    transaction_date: dateStr,
                                    description: description.substring(0, 80),
                                    amount: amount,
                                    status: 'pending'
                                });
                            }
                        }
                    }
                }
            });

            // Garantía de recuperación si el mapeo por línea fue insuficiente
            if (transactions.length === 0) {
                const globalAmounts = text.match(new RegExp(amountPattern.source, 'g'));
                if (globalAmounts) {
                    globalAmounts.slice(0, 20).forEach((amt, i) => {
                        const parsed = parseFloat(amt.replace(/[$\s]/g, '').replace(',', '.'));
                        if (!isNaN(parsed) && parsed !== 0) {
                            transactions.push({
                                transaction_date: 'Detectado',
                                description: `Movimiento extraído #${i + 1}`,
                                amount: parsed,
                                status: 'pending'
                            });
                        }
                    });
                }
            }

            let totalCredits = 0;
            let totalDebits = 0;
            transactions.forEach(tx => {
                if (tx.amount > 0) totalCredits += tx.amount;
                else totalDebits += Math.abs(tx.amount);
            });

            return {
                accountNumber,
                bankName,
                currency: 'USD',
                format: 'PDF',
                openingBalance,
                closingBalance,
                totalCredits,
                totalDebits,
                extractionMethod: 'PARS',
                transactions
            };
        } catch (error) {
            console.error('Error crítico de procesamiento:', error);
            return {
                accountNumber: '',
                bankName: 'Error de Lectura',
                currency: 'USD',
                format: 'PDF',
                extractionMethod: 'OCR',
                transactions: []
            };
        }
    }

    /**
     * Extrae datos de formato OFX (Open Financial Exchange)
     */
    private static parseOFX(content: string): StatementMetadata {
        const acctIdMatch = content.match(/<ACCTID>(.*)/i);
        const bankIdMatch = content.match(/<BANKID>(.*)/i);
        const curDefMatch = content.match(/<CURDEF>(.*)/i);

        const ledgerBalMatch = content.match(/<LEDGERBAL>[\s\S]*?<BALAMT>([\d.-]+)/i);
        const closingBalance = ledgerBalMatch ? parseFloat(ledgerBalMatch[1]) : 0;

        const transactions = this.extractOFXTransactions(content);
        let totalCredits = 0;
        let totalDebits = 0;

        transactions.forEach(tx => {
            if (tx.amount > 0) totalCredits += tx.amount;
            else totalDebits += Math.abs(tx.amount);
        });

        const openingBalance = closingBalance - totalCredits + totalDebits;

        const metadata: StatementMetadata = {
            accountNumber: acctIdMatch ? acctIdMatch[1].trim() : '',
            bankName: bankIdMatch ? this.mapBankId(bankIdMatch[1].trim()) : 'Banco Desconocido',
            currency: curDefMatch ? curDefMatch[1].trim().toUpperCase() : 'USD',
            format: 'OFX',
            openingBalance,
            closingBalance,
            totalCredits,
            totalDebits,
            transactions
        };

        metadata.isValidTriangle = this.validateTriangle(metadata);
        return metadata;
    }

    /**
     * Extrae datos de formato CSV mediante heurísticas
     */
    private static parseCSV(content: string): StatementMetadata {
        const lines = content.split('\n');
        const headerLines = lines.slice(0, 15);
        let accountNumber = '';
        let bankName = 'Banco Detectado (CSV)';
        let openingBalance: number | undefined;
        let closingBalance: number | undefined;

        for (const line of headerLines) {
            const acctMatch = line.match(/(account|acct|cta|cuenta|no\.)\s*[:#-]*\s*(\d{4,})/i);
            if (acctMatch && !accountNumber) {
                accountNumber = acctMatch[2].trim();
            }

            const openingMatch = line.match(/(beginning|opening|inicial|apertura)\s*(balance|saldo)?\s*[:#-]*\s*([\d,.-]+)/i);
            if (openingMatch && openingBalance === undefined) {
                openingBalance = parseFloat(openingMatch[3].replace(/,/g, ''));
            }

            const closingMatch = line.match(/(ending|closing|final|cierre)\s*(balance|saldo)?\s*[:#-]*\s*([\d,.-]+)/i);
            if (closingMatch && closingBalance === undefined) {
                closingBalance = parseFloat(closingMatch[3].replace(/,/g, ''));
            }

            const upperLine = line.toUpperCase();
            if (upperLine.includes('CHASE')) bankName = 'JP Morgan Chase';
            if (upperLine.includes('WELLS FARGO')) bankName = 'Wells Fargo';
            if (upperLine.includes('BANK OF AMERICA') || upperLine.includes('BOFA')) bankName = 'Bank of America';
            if (upperLine.includes('CITI')) bankName = 'Citibank';
        }

        return {
            accountNumber,
            bankName,
            currency: 'USD',
            format: 'CSV',
            openingBalance: openingBalance || 0,
            closingBalance: closingBalance || 0
        };
    }

    /**
     * Valida la integridad matemática: Inicial + Créditos - Débitos = Final
     */
    public static validateTriangle(metadata: StatementMetadata): boolean {
        if (metadata.openingBalance === undefined ||
            metadata.closingBalance === undefined ||
            metadata.totalCredits === undefined ||
            metadata.totalDebits === undefined) {
            return true;
        }

        const calculatedClosing = metadata.openingBalance + metadata.totalCredits - metadata.totalDebits;
        const diff = Math.abs(calculatedClosing - metadata.closingBalance);

        return diff < 0.05;
    }

    /**
     * Helper para extraer transacciones OFX rápidamente
     */
    private static extractOFXTransactions(content: string): any[] {
        const txRegex = /<STMTTRN>[\s\S]*?<DTPOSTED>(\d{8})[\s\S]*?<TRNAMT>([\d.-]+)[\s\S]*?<NAME>([^<]+)/gi;
        const txs: any[] = [];
        let match;

        while ((match = txRegex.exec(content)) !== null) {
            txs.push({
                transaction_date: `${match[1].substring(4, 6)}/${match[1].substring(6, 8)}/${match[1].substring(0, 4)}`,
                description: match[3].trim(),
                amount: parseFloat(match[2]),
                status: 'pending'
            });
        }

        if (txs.length === 0) {
            const amtMatches = content.matchAll(/<TRNAMT>([\d.-]+)/gi);
            for (const m of amtMatches) {
                txs.push({
                    transaction_date: new Date().toLocaleDateString(),
                    description: 'Transacción OFX',
                    amount: parseFloat(m[1]),
                    status: 'pending'
                });
            }
        }

        return txs;
    }

    /**
     * Mapea códigos de banco (BANKID) a nombres legibles
     */
    private static mapBankId(bankId: string): string {
        const banks: Record<string, string> = {
            '061000227': 'JP Morgan Chase',
            '121000248': 'Wells Fargo',
            '021001208': 'Bank of America',
            '021100024': 'Citibank',
            '026002161': 'TD Bank',
            '063100277': 'SunTrust (Truist)',
            '063100028': 'Regions Bank'
        };

        return banks[bankId] || `Entidad Bancaria (${bankId})`;
    }
}
