import React, { useEffect, useState } from 'react';
import { getDB } from '@/database/simple-db';

interface QueryResult {
    label: string;
    sql: string;
    columns: string[];
    rows: any[][];
    error?: string;
}

const QUERIES = [
    {
        label: 'Tablas existentes en la base',
        sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    },
    { label: 'Estructura: journal_details', sql: 'PRAGMA table_info(journal_details)' },
    { label: 'Estructura: ledger_lines', sql: 'PRAGMA table_info(ledger_lines)' },
    { label: 'Estructura: journal_entry_lines', sql: 'PRAGMA table_info(journal_entry_lines)' },
    { label: 'Estructura: company_data', sql: 'PRAGMA table_info(company_data)' },
    { label: 'Filas en journal_entries', sql: 'SELECT COUNT(*) as filas FROM journal_entries' },
];

export const DiagnosticPanel: React.FC = () => {
    const [results, setResults] = useState<QueryResult[]>([]);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const db = (window as any).__db || getDB();
        if (!db) {
            setResults([{ label: 'ERROR', sql: '', columns: [], rows: [], error: 'Base de datos no disponible' }]);
            return;
        }

        const output: QueryResult[] = QUERIES.map(({ label, sql }) => {
            try {
                const res = db.exec(sql);

                // exec returns [] when table doesn't exist (PRAGMA) or no rows (SELECT)
                if (!res || !Array.isArray(res) || res.length === 0) {
                    const isPragma = sql.trim().toUpperCase().startsWith('PRAGMA');
                    return {
                        label, sql,
                        columns: [],
                        rows: [],
                        error: isPragma ? '[tabla no existe]' : '[sin resultados]'
                    };
                }

                const first = res[0];

                // Guard: result[0] exists but columns/values are missing
                const columns = Array.isArray(first?.columns) ? first.columns : [];
                const rows = Array.isArray(first?.values) ? first.values : [];

                return { label, sql, columns, rows };
            } catch (e: any) {
                return {
                    label, sql,
                    columns: [], rows: [],
                    error: e?.message ?? 'Error desconocido'
                };
            }
        });

        setResults(output);
    }, []);

    const exportText = results.map(r =>
        `=== ${r.label} ===\nSQL: ${r.sql}\n` +
        (r.error
            ? `ERROR: ${r.error}`
            : [r.columns.join(' | '), ...r.rows.map(row => row.join(' | '))].join('\n'))
    ).join('\n\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(exportText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div style={{ fontFamily: 'monospace', background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ color: '#38bdf8', fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
                        🔬 DIAGNÓSTICO DE BASE DE DATOS — FASE 1
                    </h1>
                    <button
                        onClick={handleCopy}
                        style={{
                            background: copied ? '#16a34a' : '#1e40af',
                            color: 'white', border: 'none', padding: '0.5rem 1.2rem',
                            borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem'
                        }}
                    >
                        {copied ? '✓ COPIADO' : '📋 COPIAR RESULTADO'}
                    </button>
                </div>

                <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '2rem' }}>
                    Solo lectura. Este componente no modifica ningún dato.
                    Copia el resultado completo y compártelo antes de continuar a Fase 2.
                </p>

                {results.length === 0 && (
                    <p style={{ color: '#f59e0b' }}>Ejecutando consultas...</p>
                )}

                {results.map((r, i) => (
                    <div key={i} style={{
                        background: '#1e293b', borderRadius: '8px', padding: '1rem',
                        marginBottom: '1rem', border: `1px solid ${r.error ? '#ef4444' : '#334155'}`
                    }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {r.label}
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.7rem', marginBottom: '0.6rem' }}>
                            SQL: {r.sql}
                        </div>

                        {r.error ? (
                            <div style={{ color: '#fca5a5', fontSize: '0.8rem' }}>
                                ⚠ {r.error}
                            </div>
                        ) : r.rows.length === 0 ? (
                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                — Sin filas —
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                <thead>
                                    <tr>
                                        {r.columns.map((col, ci) => (
                                            <th key={ci} style={{
                                                textAlign: 'left', padding: '0.3rem 0.6rem',
                                                color: '#38bdf8', borderBottom: '1px solid #334155',
                                                fontSize: '0.7rem', fontWeight: 'bold'
                                            }}>
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {r.rows.map((row, ri) => (
                                        <tr key={ri}>
                                            {row.map((cell, ci) => (
                                                <td key={ci} style={{
                                                    padding: '0.3rem 0.6rem',
                                                    borderBottom: '1px solid #1e293b',
                                                    color: '#cbd5e1'
                                                }}>
                                                    {cell === null ? <span style={{ color: '#475569' }}>NULL</span> : String(cell)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
