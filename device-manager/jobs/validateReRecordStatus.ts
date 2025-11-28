import { ResponseService } from "@/modules/re-record-form/services/responseService";

/**
 * Periodic job to validate re-record response connection status
 * Checks active recordings and marks them as disconnected if heartbeat timeout exceeded
 */
export async function validateReRecordStatusJob() {
  try {
    // Get all active recordings (started but not finished)
    const activeRecordings = await ResponseService.getActiveRecordings();
    
    if (activeRecordings.length === 0) {
      return;
    }

    const now = Date.now();
    const timeoutMs = ResponseService.HEARTBEAT_TIMEOUT_MS;

    for (const response of activeRecordings) {
      // Skip if no heartbeat has been received yet
      if (!response.lastHeartbeat) {
        continue;
      }

      // Check if heartbeat timeout exceeded
      const timeSinceHeartbeat = now - response.lastHeartbeat;
      
      if (timeSinceHeartbeat > timeoutMs && response.isActive) {
        console.log(`[ReRecordJob] Response ${response._id} heartbeat timeout (${timeSinceHeartbeat}ms > ${timeoutMs}ms), marking as disconnected`);
        
        await ResponseService.markDisconnected(response.accessToken);
      }
    }
  } catch (error) {
    console.error("[ReRecordJob] Error during re-record status validation:", error);
  }
}

