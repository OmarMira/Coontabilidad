import React, { useEffect, useState } from 'react';
import { DatabaseService } from '../database/DatabaseService';

export const VerifyIronCore: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);

    const log = (msg: string) => setLogs(prev => [...prev, msg]);

    useEffect(() => {
        const runTests = async () => {
            log("=== INICIANDO VERIFICACIÓN IRON CORE ===");
            try {
                // 1. Columnas
                log("\n1. Verificando Columnas de journal_entries...");
                try {
                    const cols = await DatabaseService.executeQuery("PRAGMA table_info(journal_entries)");
                    log("Columnas detectadas: " + JSON.stringify(cols.map((c: any) => c.name)));

                    const hasEntryNumber = cols.some((c: any) => c.name === 'entry_number');
                    const hasTxDate = cols.some((c: any) => c.name === 'transaction_date');

                    if (hasEntryNumber && hasTxDate) log("✅ ESQUEMA CORRECTO: Columnas forenses existen.");
                    else log(`❌ ESQUEMA INCORRECTO: Faltan columnas. EntryNum: ${hasEntryNumber}, TxDate: ${hasTxDate}`);

                } catch (e: any) {
                    log("❌ Error leyendo esquema: " + e.message);
                }

                // 2. Triggers
                log("\n2. Verificando Triggers...");
                try {
                    const triggers = await DatabaseService.executeQuery("SELECT name FROM sqlite_master WHERE type='trigger'");
                    const triggerNames = triggers.map((t: any) => t.name);
                    log("Triggers activos: " + JSON.stringify(triggerNames));

                    if (triggerNames.includes('prevent_journal_update') && triggerNames.includes('prevent_journal_delete')) {
                        log("✅ TRIGGERS INSTALADOS");
                    } else {
                        log("❌ TRIGGERS FALTANTES");
                    }
                } catch (e: any) {
                    log("❌ Error leyendo triggers: " + e.message);
                }

                // 3. Condados
                log("\n3. Contando Condados...");
                try {
                    const count = await DatabaseService.executeQuery("SELECT COUNT(*) as c FROM florida_tax_config");
                    const num = count[0]?.c;
                    log(`Condados encontrados: ${num}`);
                    if (num >= 50) log("✅ POBLACIÓN EXITOSA (>50)");
                    else log("❌ POBLACIÓN INSUFICIENTE");
                } catch (e: any) {
                    log("❌ Error leyendo condados: " + e.message);
                }

                // 4. Test Inmutabilidad
                log("\n4. Intentando UPDATE prohibido (Inmutabilidad)...");
                try {
                    // Try to update ANY record. If none exists, this might not throw? 
                    // No, Trigger BEFORE UPDATE fires if update is attempted on table?
                    // Actually triggers fire per row usually. If table empty, no trigger?
                    // Let's check count first.

                    const countJE = await DatabaseService.executeQuery("SELECT COUNT(*) as c FROM journal_entries");
                    if (countJE[0].c === 0) {
                        log("⚠️ TABLA journal_entries VACÍA. Insertando registro dummy para test...");
                        // Insert dummy using raw sql to avoid Service logic complexity for this test
                        DatabaseService.executeQuery("INSERT INTO journal_entries (total_debit, total_credit, entry_date) VALUES (0,0, '2024-01-01')"); // minimal
                    }

                    await DatabaseService.executeQuery("UPDATE journal_entries SET description = 'HACKED' WHERE rowid = (SELECT rowid FROM journal_entries LIMIT 1)");
                    log("❌ FALLO CRÍTICO: UPDATE permitido (Inmutabilidad rota)");
                } catch (e: any) {
                    if (e.message.includes("FORENSIC ALERT") || e.message.includes("inmutables")) {
                        log(`✅ ÉXITO: UPDATE bloqueado por Trigger. Mensaje: ${e.message}`);
                    } else {
                        log(`❓ UPDATE falló por otra razón: ${e.message}`);
                    }
                }

            } catch (e: any) {
                log(`❌ ERROR FATAL EN TEST RUNNER: ${e.message}`);
            }
        };

        // Wait 3 seconds for DB init to be sure
        setTimeout(runTests, 3000);
    }, []);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: '#0a0a0a', color: '#00ff00', padding: 40, fontFamily: 'monospace',
            whiteSpace: 'pre-wrap', zIndex: 9999, overflow: 'auto', fontSize: '14px'
        }}>
            <h1 style={{ borderBottom: '1px solid #333', paddingBottom: 20 }}>🛡️ IRON CORE DIAGNOSTIC v1.0</h1>
            {logs.map((l, i) => <div key={i} style={{ marginBottom: 5 }}>{l}</div>)}
        </div>
    );
};
