import { DatabaseService } from '../database/DatabaseService';

/**
 * LogicClockService (NASA Level Upgrade)
 * Implements a monotonic logical clock to ensure causal ordering of all forensic events.
 * Essential for multi-tab synchronization and distributed integrity.
 */
export class LogicClockService {

    /**
     * Obtains the next logical clock value from the database.
     * Guarantees a strictly increasing sequence.
     */
    static async getNextClock(): Promise<number> {
        try {
            const result = await DatabaseService.executeQuery(
                "SELECT MAX(logic_clock) as last_clock FROM audit_chain"
            );

            const lastClock = result[0]?.last_clock || 0;
            return lastClock + 1;
        } catch (e) {
            console.error('[LogicClockService] Error fetching clock, defaulting to 1', e);
            return 1;
        }
    }
}
