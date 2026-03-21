import React, { useEffect, useState } from 'react';
import { getDBEngine } from '@/database/modules/db-core';

interface QueryResult {
    query: string;
    label: string;
    columns: string[];
    rows: any[][];
    error?: string;
    duration: number;
}

const VERIFICATION_QUERIES = [
    {
        label: 'PASO 1 — import_hash en bank_transactions',
        query: `SELECT 
      COUNT(*) as total, 
      COUNT(import_hash) as con_hash, 
      COUNT(*) - COUNT(import_hash) as sin_hash 
    FROM bank_transactions`
    },
    {
        label: 'PASO 2 — Deduplicación (duplicados detectados)',
        query: `SELECT 
      import_hash, 
      COUNT(*) as repeticiones 
    FROM bank_transactions 
    WHERE import_hash IS NOT NULL 
    GROUP BY import_hash 
    HAVING COUNT(*) > 1`
    },
    {
        label: 'PASO 3 — Estado de transacciones',
        query: `SELECT 
      current_state, 
      auto_classified, 
      COUNT(*) as cantidad 
    FROM transaction_states 
    GROUP BY current_state, auto_classified`
    },
    {
        label: 'DIAGNÓSTICO — Tablas en la base de datos',
        query: `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    },
    {
        label: 'DIAGNÓSTICO — bank_transactions (primeras 10)',
        query: `SELECT id, transaction_date, description, amount, import_hash FROM bank_transactions LIMIT 10`
    }
];

export const DiagnosticSQL: React.FC = () => {
    const [results, setResults] = useState<QueryResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Inicializando...');

    useEffect(() => {
        const runQueries = async () => {
            setStatus('Obteniendo engine de base de datos...');

            // Wait for DB engine to be ready
            let engine;
            for (let i = 0; i < 10; i++) {
                try {
                    engine = getDBEngine();
                    break;
                } catch (e) {
                    setStatus(`Esperando DB (intento ${i + 1}/10)...`);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (!engine) {
                setStatus('ERROR: No se pudo obtener el engine de base de datos');
                setLoading(false);
                return;
            }

            setStatus('Engine disponible. Ejecutando queries...');
            const queryResults: QueryResult[] = [];

            for (const q of VERIFICATION_QUERIES) {
                const start = Date.now();
                try {
                    const rows = await engine.select(q.query);
                    const duration = Date.now() - start;
                    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
                    const rowData = rows.map(r => columns.map(c => r[c]));
                    queryResults.push({ query: q.query, label: q.label, columns, rows: rowData, duration });
                } catch (e: any) {
                    const duration = Date.now() - start;
                    queryResults.push({ query: q.query, label: q.label, columns: [], rows: [], error: String(e), duration });
                }
            }

            setResults(queryResults);
            setLoading(false);
            setStatus('✅ Todas las queries ejecutadas');
        };

        // Small delay to let the DB initialize
        setTimeout(runQueries, 2000);
    }, []);

    return (
        <div style={{ fontFamily: 'monospace', background: '#0a0a0a', color: '#e2e8f0', minHeight: '100vh', padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ color: '#60a5fa', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                    🔬 VERIFICACIÓN SQL — MÓDULO BANCARIO
                </h1>
                <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '24px' }}>{status}</p>

                {loading && (
                    <div style={{ color: '#fbbf24', padding: '16px', border: '1px solid #d97706', borderRadius: '8px', marginBottom: '16px' }}>
                        ⏳ Ejecutando queries... Por favor espera.
                    </div>
                )}

                {results.map((result, i) => (
                    <div key={i} style={{ marginBottom: '32px', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ background: '#1e293b', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '13px' }}>{result.label}</span>
                            <span style={{ color: '#64748b', fontSize: '11px' }}>{result.duration}ms</span>
                        </div>

                        {/* Query */}
                        <div style={{ background: '#0f172a', padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
                            <pre style={{ color: '#94a3b8', fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>{result.query.trim()}</pre>
                        </div>

                        {/* Error */}
                        {result.error && (
                            <div style={{ background: '#450a0a', padding: '12px 16px', color: '#f87171' }}>
                                ❌ ERROR: {result.error}
                            </div>
                        )}

                        {/* Results Table */}
                        {!result.error && (
                            <div style={{ padding: '16px' }}>
                                {result.rows.length === 0 ? (
                                    <div style={{ color: '#22c55e', fontSize: '13px' }}>
                                        ✅ 0 filas devueltas (tabla vacía o sin duplicados)
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '8px' }}>{result.rows.length} fila(s)</div>
                                        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>
                                            <thead>
                                                <tr>
                                                    {result.columns.map((col, ci) => (
                                                        <th key={ci} style={{ padding: '8px 12px', textAlign: 'left', background: '#1e293b', color: '#94a3b8', fontWeight: 'bold', borderBottom: '1px solid #334155' }}>
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.rows.map((row, ri) => (
                                                    <tr key={ri} style={{ borderBottom: '1px solid #1e293b' }}>
                                                        {row.map((cell, ci) => (
                                                            <td key={ci} style={{ padding: '8px 12px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                                                                {cell === null ? <span style={{ color: '#475569' }}>NULL</span> : String(cell)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {/* Raw JSON */}
                                <details style={{ marginTop: '12px' }}>
                                    <summary style={{ color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>Ver JSON raw</summary>
                                    <pre style={{ color: '#475569', fontSize: '10px', marginTop: '8px', background: '#0f172a', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
                                        {JSON.stringify({ columns: result.columns, rows: result.rows }, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
