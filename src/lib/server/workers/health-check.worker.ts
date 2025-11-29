import { healthCheckService } from '../health-check.service';

/**
 * Health Check Worker
 * Runs periodically to check bookmark health
 */
export class HealthCheckWorker {
	private intervalId: NodeJS.Timeout | null = null;
	private isRunning = false;

	/**
	 * Start the worker
	 * @param intervalMinutes - How often to run (default: 60 minutes)
	 */
	start(intervalMinutes: number = 60) {
		if (this.isRunning) {
			console.warn('Health check worker is already running');
			return;
		}

		console.log(`🏥 Starting health check worker (interval: ${intervalMinutes} minutes)`);

		// Run immediately on start
		this.runCheck();

		// Schedule periodic runs
		this.intervalId = setInterval(
			() => {
				this.runCheck();
			},
			intervalMinutes * 60 * 1000
		);

		this.isRunning = true;
	}

	/**
	 * Stop the worker
	 */
	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.isRunning = false;
		console.log('🏥 Health check worker stopped');
	}

	/**
	 * Run health check for stale bookmarks
	 */
	private async runCheck() {
		try {
			console.log('🏥 Running health check for stale bookmarks...');
			const results = await healthCheckService.checkStaleBookmarks();

			const summary = {
				total: results.length,
				online: results.filter((r) => r.status === 'online').length,
				offline: results.filter((r) => r.status === 'offline').length,
				error: results.filter((r) => r.status === 'error').length
			};

			console.log('🏥 Health check completed:', summary);
		} catch (error) {
			console.error('🏥 Health check worker error:', error);
		}
	}

	/**
	 * Get worker status
	 */
	getStatus() {
		return {
			running: this.isRunning,
			intervalId: this.intervalId !== null
		};
	}
}

// Export singleton instance
export const healthCheckWorker = new HealthCheckWorker();
