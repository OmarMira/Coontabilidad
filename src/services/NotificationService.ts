import { TaxReportingService } from './TaxReportingService';

export class NotificationService {

    static async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) return false;

        if (Notification.permission === 'granted') return true;

        if (Notification.permission !== 'denied') {
            const result = await Notification.requestPermission();
            return result === 'granted';
        }
        return false;
    }

    static async checkAndNotify(): Promise<void> {
        // Only run in browser
        if (typeof window === 'undefined') return;

        const hasPermission = await this.requestPermission();
        if (!hasPermission) return;

        // Get alerts
        const alerts = await TaxReportingService.getComplianceAlerts();
        const important = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning');

        if (important.length === 0) return;

        // Check if we already notified today (LocalStorage)
        const lastNotified = localStorage.getItem('last_tax_notification');
        const today = new Date().toDateString();

        // If notified today, skip
        if (lastNotified === today) return;

        // Notify top alert
        const topAlert = important[0];
        const title = topAlert.severity === 'critical' ? '⚠️ CRITICAL TAX ALERT' : '⚠️ Tax Deadline Warning';
        const body = `${topAlert.title} is due in ${topAlert.daysRemaining} days. Check Dashboard for details.`;

        // Browser Notification
        try {
            new Notification(title, {
                body: body,
                icon: '/vite.svg', // Default vite icon if available
                tag: 'tax-alert',
                requireInteraction: true
            });
            console.log("Notification sent:", title);
            localStorage.setItem('last_tax_notification', today);
        } catch (e) {
            console.error("Notification failed", e);
        }
    }

    // Schedule check (e.g. call this on App init)
    static init() {
        if (typeof window === 'undefined') return;

        // Check on load with small delay to not block UI
        setTimeout(() => this.checkAndNotify(), 5000);

        // Check every hour (if app stays open)
        setInterval(() => this.checkAndNotify(), 3600000);
    }
}
