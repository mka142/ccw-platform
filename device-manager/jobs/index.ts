import { validateUserStatusJob } from "./validateUserStatus";
import { validateReRecordStatusJob } from "./validateReRecordStatus";

/**
 * Job Scheduler
 * Manages periodic background jobs
 */
export class JobScheduler {
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  /**
   * Start all scheduled jobs
   */
  start() {
    console.log("🔄 Starting job scheduler...");

    // Start user status validation job (runs every 10 seconds)
    this.scheduleJob("validateUserStatus", validateUserStatusJob, 10000);

    // Start re-record status validation job (runs every 5 seconds)
    this.scheduleJob("validateReRecordStatus", validateReRecordStatusJob, 5000);

    console.log("✅ Job scheduler started");
  }

  /**
   * Schedule a periodic job
   * @param name Job name for identification
   * @param job Function to execute
   * @param intervalMs Interval in milliseconds
   */
  private scheduleJob(name: string, job: () => Promise<void>, intervalMs: number) {
    // Run immediately on start
    job().catch((error) => {
      console.error(`[JobScheduler] Error running job ${name}:`, error);
    });

    // Schedule periodic execution
    const interval = setInterval(() => {
      job().catch((error) => {
        console.error(`[JobScheduler] Error running job ${name}:`, error);
      });
    }, intervalMs);

    this.intervals.set(name, interval);
    console.log(`[JobScheduler] Scheduled job: ${name} (every ${intervalMs}ms)`);
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log("🛑 Stopping job scheduler...");

    for (const [name, interval] of this.intervals.entries()) {
      clearInterval(interval);
      console.log(`[JobScheduler] Stopped job: ${name}`);
    }

    this.intervals.clear();
    console.log("✅ Job scheduler stopped");
  }
}

// Export singleton instance
export const jobScheduler = new JobScheduler();
