/**
 * StatementSmartParser
 * 
 * Servicio para extraer metadatos de estados de cuenta bancarios (OFX, CSV).
 * Detecta números de cuenta y nombres de bancos para automatizar la selección.
 */

export interface StatementMetadata {
    accountNumber: string;
    bankName: string;
    currency: string;
    format: 'OFX' | 'CSV' | 'UNKNOWN';
}

export class StatementSmartParser {
    /**
     * Analiza un archivo para extraer metadatos básicos
     */
    public static async parseMetadata(file: File): Promise<StatementMetadata> {
        const text = await file.text();
        const extension = file.name.split('.').pop()?.toUpperCase();

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
     * Extrae datos de formato OFX (Open Financial Exchange)
     */
    private static parseOFX(content: string): StatementMetadata {
        // El OFX es un formato SGML/XML
        const acctIdMatch = content.match(/<ACCTID>(.*)/i);
        const bankIdMatch = content.match(/<BANKID>(.*)/i);
        const curDefMatch = content.match(/<CURDEF>(.*)/i);

        return {
            accountNumber: acctIdMatch ? acctIdMatch[1].trim() : '',
            bankName: bankIdMatch ? this.mapBankId(bankIdMatch[1].trim()) : 'Banco Desconocido',
            currency: curDefMatch ? curDefMatch[1].trim().toUpperCase() : 'USD',
            format: 'OFX'
        };
    }

    /**
     * Extrae datos de formato CSV mediante heurísticas
     */
    private static parseCSV(content: string): StatementMetadata {
        const lines = content.split('\n').slice(0, 10); // Revisar las primeras 10 líneas
        let accountNumber = '';
        let bankName = 'Banco Detectado (CSV)';

        for (const line of lines) {
            // Buscar patrones comunes de cuenta: Account Number, Acct No, # Cuenta
            const acctMatch = line.match(/(account|acct|cta|cuenta|no\.)\s*[:#-]*\s*(\d{4,})/i);
            if (acctMatch && !accountNumber) {
                accountNumber = acctMatch[2].trim();
            }

            // Heurística de nombre de banco basado en palabras clave
            if (line.toUpperCase().includes('CHASE')) bankName = 'JP Morgan Chase';
            if (line.toUpperCase().includes('WELLS FARGO')) bankName = 'Wells Fargo';
            if (line.toUpperCase().includes('BANK OF AMERICA') || line.toUpperCase().includes('BOFA')) bankName = 'Bank of America';
            if (line.toUpperCase().includes('CITI')) bankName = 'Citibank';
        }

        return {
            accountNumber,
            bankName,
            currency: 'USD', // Por defecto para AccountExpress (FloridaFocus)
            format: 'CSV'
        };
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
