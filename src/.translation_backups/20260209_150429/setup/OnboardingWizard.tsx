import React, { useState, useEffect } from 'react';
import { FirstRunSetup } from '../../core/setup/FirstRunSetup';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

/**
 * OnboardingWizard - First-run user experience
 * 
 * Guía al usuario en el setup inicial del sistema
 */
export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
    db,
    onComplete
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [setupStatus, setSetupStatus] = useState<SetupStatus>({
        database: 'pending',
        accounts: 'pending',
        ai: 'pending'
    });

    useEffect(() => {
        // Check if setup is needed
        checkSetupStatus();
    }, []);

    const checkSetupStatus = async () => {
        const setup = new FirstRunSetup(db);
        const isFirst = await setup.isFirstRun();

        if (!isFirst) {
            // Already setup - skip wizard
            onComplete();
        }
    };

    const runAutoSetup = async () => {
        setIsLoading(true);
        setSetupStatus({ database: 'loading', accounts: 'pending', ai: 'pending' });

        try {
            const setup = new FirstRunSetup(db);

            // Run setup
            setSetupStatus({ database: 'loading', accounts: 'loading', ai: 'loading' });
            const result = await setup.run();

            if (result.success) {
                setSetupStatus({ database: 'success', accounts: 'success', ai: 'success' });
                setTimeout(() => {
                    onComplete();
                }, 1500);
            } else {
                setSetupStatus({ database: 'error', accounts: 'error', ai: 'error' });
            }
        } catch (error) {
            console.error('Setup failed:', error);
            setSetupStatus({ database: 'error', accounts: 'error', ai: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome to Account Express
                    </h1>
                    <p className="text-slate-700">
                        {currentStep === 0 ? 'Let\'s set up your accounting system' : 'Setting up...'}
                    </p>
                </div>

                {/* Content */}
                {currentStep === 0 && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="font-semibold text-blue-900 mb-2">
                                ✨ Zero Configuration Required
                            </h3>
                            <p className="text-blue-700 mb-4">
                                Account Express will automatically:
                            </p>
                            <ul className="space-y-2 text-blue-700">
                                <li>✅ Initialize your database</li>
                                <li>✅ Load US GAAP chart of accounts</li>
                                <li>✅ Configure AI assistant (works offline)</li>
                                <li>✅ Set up Florida tax rates</li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={runAutoSetup}
                                disabled={isLoading}
                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? 'Setting up...' : 'Start Using Account Express'}
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Setup Progress</h3>

                        <SetupProgress
                            label="Database Initialization"
                            status={setupStatus.database}
                        />

                        <SetupProgress
                            label="Chart of Accounts"
                            status={setupStatus.accounts}
                        />

                        <SetupProgress
                            label="AI Assistant"
                            status={setupStatus.ai}
                            description="Transformers.js - Works offline, no API key needed"
                        />

                        {setupStatus.database === 'success' &&
                            setupStatus.accounts === 'success' &&
                            setupStatus.ai === 'success' && (
                                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-green-800 font-semibold">
                                        ✅ Setup complete! Redirecting...
                                    </p>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Setup progress indicator
const SetupProgress: React.FC<{
    label: string;
    status: StepStatus;
    description?: string;
}> = ({ label, status, description }) => {
    return (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
                {status === 'pending' && (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                )}
                {status === 'loading' && (
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                {status === 'success' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
                {status === 'error' && (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="flex-1">
                <p className="font-medium text-gray-900">{label}</p>
                {description && (
                    <p className="text-sm text-slate-600">{description}</p>
                )}
            </div>
        </div>
    );
};

// ==========================================
// TYPE DEFINITIONS
// ==========================================

type StepStatus = 'pending' | 'loading' | 'success' | 'error';

interface SetupStatus {
    database: StepStatus;
    accounts: StepStatus;
    ai: StepStatus;
}

interface OnboardingWizardProps {
    db: SQLiteEngine;
    onComplete: () => void;
}
