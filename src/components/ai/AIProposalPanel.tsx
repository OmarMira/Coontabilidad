/**
 * AIProposalPanel (Iron Clad Upgrade - Phase 3, Day 1)
 * 
 * Panel para mostrar y gestionar propuestas generadas por la IA.
 * La IA detecta anomalías y propone correcciones automáticamente.
 */

import React, { useState, useEffect } from 'react';
import { DraftProposalService } from '../../services/DraftProposalService';
import { useLocale } from '../../i18n/useLocale';

interface Proposal {
    id: number;
    module: string;
    operation: string;
    payload: string;
    ai_proposal_reason: string;
    status: string;
    created_at: string;
}

export function AIProposalPanel() {
    const { t } = useLocale();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

    useEffect(() => {
        loadProposals();

        // Reload proposals every 30 seconds
        const interval = setInterval(loadProposals, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadProposals = async () => {
        setLoading(true);
        try {
            const pending = await DraftProposalService.getPendingProposals();
            setProposals(pending);
        } catch (error) {
            console.error('Error loading proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        if (confirm(t('aiAssistant.proposals.approveConfirm'))) {
            try {
                await DraftProposalService.approveProposal(id);
                await loadProposals();
                alert(t('aiAssistant.proposals.approveSuccess'));
            } catch (error: any) {
                alert(t('aiAssistant.proposals.approveError', { error: error.message }));
            }
        }
    };

    const handleReject = async (id: number) => {
        if (confirm(t('aiAssistant.proposals.rejectConfirm'))) {
            try {
                await DraftProposalService.rejectProposal(id);
                await loadProposals();
                alert(t('aiAssistant.proposals.rejectSuccess'));
            } catch (error: any) {
                alert(t('aiAssistant.proposals.rejectError', { error: error.message }));
            }
        }
    };

    const parsePayload = (payload: string) => {
        try {
            return JSON.parse(payload);
        } catch {
            return payload;
        }
    };

    if (loading && proposals.length === 0) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>{t('aiAssistant.proposals.loading')}</p>
            </div>
        );
    }

    if (proposals.length === 0) {
        return (
            <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🤖</div>
                <h3 style={styles.emptyTitle}>{t('aiAssistant.proposals.emptyTitle')}</h3>
                <p style={styles.emptyText}>
                    {t('aiAssistant.proposals.emptyText')}
                </p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>
                    🤖 {t('aiAssistant.proposals.title')}
                    <span style={styles.badge}>{proposals.length}</span>
                </h2>
                <p style={styles.subtitle}>
                    {t('aiAssistant.proposals.subtitle')}
                </p>
            </div>

            <div style={styles.proposalsList}>
                {proposals.map((proposal) => (
                    <div
                        key={proposal.id}
                        style={{
                            ...styles.proposalCard,
                            ...(selectedProposal === proposal.id ? styles.proposalCardSelected : {})
                        }}
                        onClick={() => setSelectedProposal(proposal.id)}
                    >
                        <div style={styles.proposalHeader}>
                            <div style={styles.badges}>
                                <span style={{ ...styles.moduleBadge, ...getModuleColor(proposal.module) }}>
                                    {proposal.module}
                                </span>
                                <span style={styles.operationBadge}>
                                    {proposal.operation}
                                </span>
                            </div>
                            <span style={styles.timestamp}>
                                {new Date(proposal.created_at).toLocaleString('es-ES', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>

                        <div style={styles.proposalReason}>
                            <div style={styles.reasonIcon}>💡</div>
                            <div>
                                <strong style={styles.reasonLabel}>{t('aiAssistant.proposals.reason')}:</strong>
                                <p style={styles.reasonText}>{proposal.ai_proposal_reason}</p>
                            </div>
                        </div>

                        <div style={styles.proposalPayload}>
                            <strong style={styles.payloadLabel}>{t('aiAssistant.proposals.changes')}:</strong>
                            <pre style={styles.payloadCode}>
                                {JSON.stringify(parsePayload(proposal.payload), null, 2)}
                            </pre>
                        </div>

                        <div style={styles.proposalActions}>
                            <button
                                style={{ ...styles.button, ...styles.buttonApprove }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(proposal.id);
                                }}
                            >
                                ✅ {t('aiAssistant.apply')}
                            </button>
                            <button
                                style={{ ...styles.button, ...styles.buttonReject }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReject(proposal.id);
                                }}
                            >
                                ❌ {t('aiAssistant.reject')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={styles.footer}>
                <p style={styles.footerText}>
                    💡 {t('aiAssistant.proposals.footerTip')}
                </p>
            </div>
        </div>
    );
}

// Helper function for module colors
function getModuleColor(module: string): React.CSSProperties {
    const colors: { [key: string]: React.CSSProperties } = {
        'accounting': { backgroundColor: '#e3f2fd', color: '#1976d2' },
        'payroll': { backgroundColor: '#f3e5f5', color: '#7b1fa2' },
        'taxes': { backgroundColor: '#fff3e0', color: '#e65100' },
        'inventory': { backgroundColor: '#e8f5e9', color: '#388e3c' },
        'default': { backgroundColor: '#f5f5f5', color: '#616161' }
    };
    return colors[module] || colors['default'];
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
        marginBottom: '32px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    badge: {
        backgroundColor: '#007bff',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '600',
        padding: '4px 12px',
        borderRadius: '12px'
    },
    subtitle: {
        fontSize: '16px',
        color: '#666',
        margin: '0'
    },
    proposalsList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px'
    },
    proposalCard: {
        backgroundColor: '#fff',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    proposalCardSelected: {
        borderColor: '#007bff',
        boxShadow: '0 4px 12px rgba(0,123,255,0.15)'
    },
    proposalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    },
    badges: {
        display: 'flex',
        gap: '8px'
    },
    moduleBadge: {
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600'
    },
    operationBadge: {
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        backgroundColor: '#f5f5f5',
        color: '#333'
    },
    timestamp: {
        fontSize: '13px',
        color: '#999'
    },
    proposalReason: {
        display: 'flex',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#fff8e1',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        marginBottom: '16px'
    },
    reasonIcon: {
        fontSize: '24px',
        flexShrink: 0
    },
    reasonLabel: {
        fontSize: '14px',
        color: '#333',
        display: 'block',
        marginBottom: '4px'
    },
    reasonText: {
        fontSize: '14px',
        color: '#666',
        margin: '0',
        lineHeight: '1.5'
    },
    proposalPayload: {
        marginBottom: '16px'
    },
    payloadLabel: {
        fontSize: '14px',
        color: '#333',
        display: 'block',
        marginBottom: '8px'
    },
    payloadCode: {
        backgroundColor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        padding: '12px',
        fontSize: '13px',
        fontFamily: 'Monaco, Consolas, monospace',
        overflow: 'auto',
        maxHeight: '200px',
        margin: '0'
    },
    proposalActions: {
        display: 'flex',
        gap: '12px'
    },
    button: {
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '500',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flex: 1
    },
    buttonApprove: {
        backgroundColor: '#28a745',
        color: '#fff'
    },
    buttonReject: {
        backgroundColor: '#dc3545',
        color: '#fff'
    },
    footer: {
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center' as const
    },
    footerText: {
        fontSize: '14px',
        color: '#666',
        margin: '0'
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: '#666'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
    },
    emptyState: {
        textAlign: 'center' as const,
        padding: '60px 20px'
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '16px'
    },
    emptyTitle: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '8px'
    },
    emptyText: {
        fontSize: '16px',
        color: '#666',
        maxWidth: '500px',
        margin: '0 auto'
    }
};
