import React, { useEffect, useState } from 'react';
import { DatabaseService } from '../database/DatabaseService';
import { useLocale } from '../i18n/useLocale';

export const VerifyIronCore: React.FC = () => {
    const { t } = useLocale();
    const [logs, setLogs] = useState<string[]>([]);

    const log = (msg: string) => setLogs(prev => [...prev, msg]);

    useEffect(() => {
        const runTests = async () => {
            log(t('verifyIronCore.starting'));
            try {
                // 1. Columnas
                log("\n" + t('verifyIronCore.verifyingColumns'));
                try {
                    const cols = await DatabaseService.executeQuery("PRAGMA table_info(journal_entries)");
                    log(t('verifyIronCore.columnsDetected') + JSON.stringify(cols.map((c: any) => c.name)));

                    const hasEntryNumber = cols.some((c: any) => c.name === 'entry_number');
                    const hasTxDate = cols.some((c: any) => c.name === 'transaction_date');

                    if (hasEntryNumber && hasTxDate) log(t('verifyIronCore.schemeCorrect'));
                    else log(t('verifyIronCore.schemeIncorrect') + ` EntryNum: ${hasEntryNumber}, TxDate: ${hasTxDate}`);

                } catch (e: any) {
                    log(t('verifyIronCore.errorReadingScheme') + e.message);
                }

                // 2. Triggers
                log("\n" + t('verifyIronCore.verifyingTriggers'));
                try {
                    const triggers = await DatabaseService.executeQuery("SELECT name FROM sqlite_master WHERE type='trigger'");
                    const triggerNames = triggers.map((t: any) => t.name);
                    log(t('verifyIronCore.activeTriggers') + JSON.stringify(triggerNames));

                    if (triggerNames.includes('prevent_journal_update') && triggerNames.includes('prevent_journal_delete')) {
                        log(t('verifyIronCore.triggersInstalled'));
                    } else {
                        log(t('verifyIronCore.triggersMissing'));
                    }
                } catch (e: any) {
                    log(t('verifyIronCore.errorReadingTriggers') + e.message);
                }

                // 3. Condados
                log("\n" + t('verifyIronCore.countingCounties'));
                try {
                    const count = await DatabaseService.executeQuery("SELECT COUNT(*) as c FROM florida_tax_rates");
                    const num = count[0]?.c;
                    log(t('verifyIronCore.countiesFound') + num);
                    if (num >= 50) log(t('verifyIronCore.populationSuccessful'));
                    else log(t('verifyIronCore.populationInsufficient'));
                } catch (e: any) {
                    log(t('verifyIronCore.errorReadingCounties') + e.message);
                }

                // 4. Test Inmutabilidad
                log("\n" + t('verifyIronCore.testingImmutability'));
                try {
                    const countJE = await DatabaseService.executeQuery("SELECT COUNT(*) as c FROM journal_entries");
                    if (countJE[0].c === 0) {
                        log(t('verifyIronCore.emptyTableWarning'));
                        DatabaseService.executeQuery("INSERT INTO journal_entries (total_debit, total_credit, entry_date) VALUES (0,0, '2024-01-01')");
                    }

                    await DatabaseService.executeQuery("UPDATE journal_entries SET description = 'HACKED' WHERE rowid = (SELECT rowid FROM journal_entries LIMIT 1)");
                    log(t('verifyIronCore.criticalFailure'));
                } catch (e: any) {
                    if (e.message.includes("FORENSIC ALERT") || e.message.includes("inmutables") || e.message.includes("immutable")) {
                        log(t('verifyIronCore.immutabilitySuccess') + e.message);
                    } else {
                        log(t('verifyIronCore.unknownFailure') + e.message);
                    }
                }

            } catch (e: any) {
                log(t('verifyIronCore.fatalError') + e.message);
            }
        };

        // Wait 3 seconds for DB init to be sure
        setTimeout(runTests, 3000);
    }, [t]);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: '#0a0a0a', color: '#00ff00', padding: 40, fontFamily: 'monospace',
            whiteSpace: 'pre-wrap', zIndex: 9999, overflow: 'auto', fontSize: '14px'
        }}>
            <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '20px' }}>{t('verifyIronCore.title')}</h1>
            {logs.map((l, i) => <div key={i} style={{ marginBottom: '5px' }}>{l}</div>)}
        </div>
    );
};
