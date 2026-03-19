import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, RefreshCw, FileOutput } from 'lucide-react';
import '../../styles/emergency.css';

interface EmergencyScreenProps {
    message: string;
    onRetry?: () => void;
    onExport?: () => void;
}

export const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ message, onRetry, onExport }) => {
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        // SimulaciÃ³n de progreso de inicializaciÃ³n de emergencia
        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + (Math.random() * 8);
                return next > 95 ? 95 : next;
            });

            const newLog = `[${new Date().toLocaleTimeString()}] Procesando: ${message}... (${Math.round(progress)}%)`;
            setLogs(prev => [newLog, ...prev].slice(0, 50));
        }, 800);

        return () => clearInterval(interval);
    }, [message, progress]);

    return (
        <div className="emergency-screen">
            <header className="emergency-header">
                <AlertTriangle className="emergency-icon" size={64} />
                <h1 className="emergency-title">Modo de RecuperaciÃ³n</h1>
                <p className="emergency-subtitle">
                    AccountExpress estÃ¡ solucionando un conflicto de integridad en la base de datos.
                </p>
            </header>

            <main className="emergency-content">
                <section className="progress-section">
                    <div className="progress-label">
                        <strong>Restaurando integridad del sistema...</strong>
                        <span>{Math.round(progress)}%</span>
                    </div>

                    <div className="progress-bar-large">
                        <div
                            className="progress-fill-large"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="status-message">
                        <div className="emergency-spinner"></div>
                        <span>{message}</span>
                    </div>
                </section>

                <section className="logs-section">
                    <h3>Registro de RecuperaciÃ³n:</h3>
                    <div className="logs-container">
                        {logs.map((log, index) => (
                            <div key={index} className="log-entry">
                                <code>{log}</code>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="actions-section">
                    <p className="instructions">
                        <strong>No cierre esta ventana.</strong> El sistema estÃ¡ analizando las tablas y reparando las relaciones externas de forma segura.
                        El proceso finalizarÃ¡ automÃ¡ticamente.
                    </p>

                    <div className="emergency-actions">
                        <button
                            onClick={onRetry || (() => window.location.reload())}
                            className="emergency-btn emergency-btn-outline flex items-center gap-2"
                        >
                            <RefreshCw size={18} /> Reintentar Carga
                        </button>

                        <button
                            onClick={onExport || (() => logger.info('EmergencyScreen', 'info', 'Exporting debug info...'))}
                            className="emergency-btn emergency-btn-destructive flex items-center gap-2"
                        >
                            <FileOutput size={18} /> Exportar DiagnÃ³stico
                        </button>
                    </div>
                </section>
            </main>

            <footer className="emergency-footer">
                <div className="footer-inner">
                    <Shield size={16} />
                    <span>AccountExpress Next-Gen â€¢ Sistema Forense Florida â€¢ Motor de RecuperaciÃ³n AtÃ³mica</span>
                </div>
            </footer>
        </div>
    );
};
