import React, { Component, ErrorInfo, ReactNode } from 'react';
import { UISyncManager } from '../../core/UISyncManager';
import { logger } from '../../utils/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    isRecovering: boolean;
    recoveryProgress: number;
}

export class DynamicErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            isRecovering: false,
            recoveryProgress: 0
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            isRecovering: false,
            recoveryProgress: 0
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        logger.error('Error capturado por boundary:', { error: error.message, errorInfo }, error, 'ErrorBoundary');

        // Interceptar error FK específico
        if (error.message.includes('FOREIGN KEY constraint failed')) {
            this.handleFKError(error);
        }
    }

    private async handleFKError(error: Error): Promise<void> {
        this.setState({ isRecovering: true });

        // Mostrar progreso de recuperación
        const progressInterval = setInterval(() => {
            this.setState(prev => ({
                recoveryProgress: Math.min(prev.recoveryProgress + 10, 90)
            }));
        }, 300);

        try {
            // Intentar recuperación automática
            const recovered = await UISyncManager.interceptAndRecover(error);

            if (recovered) {
                this.setState({ recoveryProgress: 100 });

                // Esperar para mostrar éxito
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Reiniciar componente
                this.resetErrorBoundary();
            } else {
                throw new Error('Recuperación automática falló');
            }

        } catch (recoveryError: any) {
            logger.error('Recuperación falló:', { error: recoveryError.message }, recoveryError, 'ErrorBoundary');
            this.setState({
                isRecovering: false,
                recoveryProgress: 0
            });

        } finally {
            clearInterval(progressInterval);
        }
    }

    private resetErrorBoundary(): void {
        this.setState({
            hasError: false,
            error: null,
            isRecovering: false,
            recoveryProgress: 0
        });

        // Forzar re-render de componentes hijos
        this.forceUpdate();

        // Emitir evento de recuperación
        window.dispatchEvent(new CustomEvent('error-boundary-reset'));
    }

    // Técnicas adicionales solicitadas por la UI
    private clearLocalStorage = () => {
        localStorage.clear();
        alert('LocalStorage limpiado. La página se recargará.');
        window.location.reload();
    };

    private clearIndexedDB = async () => {
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
        });
        alert('Bases de datos IndexedDB eliminadas. La página se recargará.');
        window.location.reload();
    };

    private resetServiceWorker = async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
            await registration.unregister();
        }
        alert('Service Worker desinstalado. La página se recargará.');
        window.location.reload();
    };

    private forceDatabaseRebuild = async () => {
        localStorage.setItem('force_clean_start', 'true');
        window.location.href = '/?clean=1';
    };

    private exportDiagnosticReport = () => {
        const diagnostic = {
            error: this.state.error?.message,
            stack: this.state.error?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            storage: {
                localStorage: { ...localStorage },
                sessionStorage: { ...sessionStorage }
            }
        };
        const blob = new Blob([JSON.stringify(diagnostic, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagnostic-${Date.now()}.json`;
        a.click();
    };

    private renderErrorFallback(): ReactNode {
        const { error, isRecovering, recoveryProgress } = this.state;

        if (this.props.fallback) {
            return this.props.fallback;
        }

        return (
            <div className="error-boundary-container">
                <div className="error-header">
                    <div className="error-icon">⚠️</div>
                    <h2>Error en AccountExpress</h2>
                    <p className="error-subtitle">
                        Sistema ERP de última generación • Cifrado AES-256
                    </p>
                </div>

                <div className="error-content">
                    <div className="error-details">
                        <h3>Detalles del error:</h3>
                        <code className="error-message">
                            {error?.message || 'Error desconocido'}
                        </code>

                        <div className="error-context">
                            <p>
                                <strong>Timestamp:</strong> {new Date().toLocaleString()}
                            </p>
                            <p>
                                <strong>Componente:</strong> {window.location.pathname}
                            </p>
                            <p>
                                <strong>Versión:</strong> Enterprise V4.0 • Engine V1.2
                            </p>
                        </div>
                    </div>

                    {isRecovering ? (
                        <div className="recovery-section">
                            <h3>🔄 Recuperación Automática en Progreso</h3>

                            <div className="recovery-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${recoveryProgress}%` }}
                                    />
                                </div>
                                <span className="progress-text">{recoveryProgress}%</span>
                            </div>

                            <div className="recovery-steps">
                                <div className={`step ${recoveryProgress >= 20 ? 'completed' : ''}`}>
                                    <span className="step-number">1</span>
                                    <span className="step-text">Verificando integridad de base de datos</span>
                                </div>

                                <div className={`step ${recoveryProgress >= 50 ? 'completed' : ''}`}>
                                    <span className="step-number">2</span>
                                    <span className="step-text">Sincronizando interfaz de usuario</span>
                                </div>

                                <div className={`step ${recoveryProgress >= 80 ? 'completed' : ''}`}>
                                    <span className="step-number">3</span>
                                    <span className="step-text">Reiniciando componentes críticos</span>
                                </div>

                                <div className={`step ${recoveryProgress >= 100 ? 'completed' : ''}`}>
                                    <span className="step-number">4</span>
                                    <span className="step-text">Restaurando funcionalidad completa</span>
                                </div>
                            </div>

                            <p className="recovery-note">
                                El sistema se recuperará automáticamente. No cierre esta ventana.
                            </p>
                        </div>
                    ) : (
                        <div className="actions-section">
                            <h3>¿Qué desea hacer?</h3>

                            <div className="action-buttons">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => UISyncManager.interceptAndRecover(error!)}
                                >
                                    🔄 Intentar Recuperación Automática
                                </button>

                                <button
                                    className="btn btn-secondary"
                                    onClick={() => window.location.reload()}
                                >
                                    ↻ Recargar Página
                                </button>

                                <button
                                    className="btn btn-outline"
                                    onClick={this.forceDatabaseRebuild}
                                >
                                    🧹 Inicio Limpio
                                </button>

                                <button
                                    className="btn btn-destructive"
                                    onClick={this.exportDiagnosticReport}
                                >
                                    📋 Exportar Diagnóstico
                                </button>
                            </div>

                            <div className="technical-actions">
                                <details>
                                    <summary>Acciones técnicas avanzadas</summary>

                                    <div className="technical-buttons">
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={this.clearLocalStorage}
                                        >
                                            Limpiar LocalStorage
                                        </button>

                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={this.clearIndexedDB}
                                        >
                                            Limpiar IndexedDB
                                        </button>

                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={this.resetServiceWorker}
                                        >
                                            Reset Service Worker
                                        </button>

                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={this.forceDatabaseRebuild}
                                        >
                                            Reconstruir Base de Datos
                                        </button>
                                    </div>
                                </details>
                            </div>
                        </div>
                    )}
                </div>

                <div className="error-footer">
                    <p className="footer-text">
                        AccountExpress Next-Gen • Sistema Forense Florida •
                        <span className="version">v4.0.1</span>
                    </p>
                    <p className="footer-subtext">
                        SQLite Local Engine • AES-256 Military Grade • Cloud Synced
                    </p>
                </div>
            </div>
        );
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return this.renderErrorFallback();
        }

        return this.props.children;
    }
}
