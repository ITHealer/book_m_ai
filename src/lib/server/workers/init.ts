import { healthCheckWorker } from './health-check.worker';
import { embeddingWorker } from './embedding.worker';
import config from '$lib/config';

/**
 * Initialize all background workers
 * Call this function when the server starts
 */
export function initializeWorkers() {
	console.log('🚀 Initializing background workers...');

	// Start health check worker
	// Check every 60 minutes by default
	const healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL_MINUTES || '60');

	// Start embedding worker
	// Check every 30 minutes by default
	const embeddingInterval = parseInt(process.env.EMBEDDING_INTERVAL_MINUTES || '30');

	// Only start workers if not in development mode or if explicitly enabled
	const enableWorkers = process.env.ENABLE_WORKERS === 'true' || process.env.NODE_ENV === 'production';

	if (enableWorkers) {
		healthCheckWorker.start(healthCheckInterval);
		console.log('✅ Health check worker started');

		// Start embedding worker if AI service is configured
		if (process.env.HEALER_AI_BASE_URL) {
			embeddingWorker.start(embeddingInterval);
			console.log('✅ Embedding worker started');
		} else {
			console.log('⏸️ Embedding worker disabled (HEALER_AI_BASE_URL not set)');
		}
	} else {
		console.log('⏸️ Workers disabled (set ENABLE_WORKERS=true to enable)');
	}
}

/**
 * Shutdown all workers gracefully
 */
export function shutdownWorkers() {
	console.log('🛑 Shutting down background workers...');
	healthCheckWorker.stop();
	embeddingWorker.stop();
	console.log('✅ All workers stopped');
}

// Handle process termination
if (typeof process !== 'undefined') {
	process.on('SIGTERM', shutdownWorkers);
	process.on('SIGINT', shutdownWorkers);
}
