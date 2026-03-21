import { logger } from '../../core/logging/SystemLogger';

import { SQLiteEngine } from './SQLiteEngine';

/**
 * EngineBridge - Bridge for safe singleton access to the database engine.
 * Prevents circular dependencies between database initialization and AI services.
 */
class EngineBridge {
    private static instance: SQLiteEngine | null = null;

    public static setEngine(engine: SQLiteEngine): void {
        this.instance = engine;
    }

    public static getEngine(): SQLiteEngine {
        if (!this.instance) {
            // Internal fallback to prevent hard crash if not initialized yet
            // Though proper initialization flow should call setEngine first.
            logger.warn('EngineBridge', 'warn', 'EngineBridge: Accessing engine before initialization.');
            this.instance = new SQLiteEngine();
        }
        return this.instance;
    }

    public static hasEngine(): boolean {
        return this.instance !== null;
    }
}

export { EngineBridge };
