import { ResponseService } from "@/modules/re-record-form/services/responseService";
import { checkRecordingTimeout } from "@/modules/re-record-form/lib/timeoutUtils";

/**
 * Periodic job to validate re-record response connection status
 * Checks active recordings and marks them as disconnected if heartbeat timeout exceeded
 * Also checks if recording exceeded timeout (1.5 * pieceDuration + 2 minutes) and marks as inactive with error
 */
export async function validateReRecordStatusJob() {
  try {
    // Get all active recordings (started but not finished)
    const activeRecordings = await ResponseService.getActiveRecordings();
    
    if (activeRecordings.length === 0) {
      return;
    }

    const now = Date.now();
    const heartbeatTimeoutMs = ResponseService.HEARTBEAT_TIMEOUT_MS;

    for (const response of activeRecordings) {
      // Check if recording exceeded timeout using the utility function
      if (response.isActive && checkRecordingTimeout(response, now)) {
        const elapsed = now - (response.recordingTimestampStart || 0);
        const timeoutThreshold = (response.pieceDuration || 0) * 1 + 2 * 60 * 1000;
        const errorMessage = "Status 'finished' was not called properly by user. Recording exceeded maximum allowed time.";
        
        console.log(`[ReRecordJob] Response ${response._id} exceeded timeout (${elapsed}ms > ${timeoutThreshold}ms), marking as inactive with error`);
        
        await ResponseService.markTimedOut(response.accessToken, errorMessage);
        continue; // Skip heartbeat check for timed out responses
      }

      // Check if heartbeat timeout exceeded
      if (response.lastHeartbeat) {
        const timeSinceHeartbeat = now - response.lastHeartbeat;
        
        if (timeSinceHeartbeat > heartbeatTimeoutMs && response.isActive) {
          console.log(`[ReRecordJob] Response ${response._id} heartbeat timeout (${timeSinceHeartbeat}ms > ${heartbeatTimeoutMs}ms), marking as disconnected`);
          
          await ResponseService.markDisconnected(response.accessToken);
        }
      }
    }
  } catch (error) {
    console.error("[ReRecordJob] Error during re-record status validation:", error);
  }
}

