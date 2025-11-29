import type { ResponseWithId } from "../types";

/**
 * Check if a recording has exceeded the timeout threshold
 * Timeout is calculated as: pieceDuration * 1.5 + 2 minutes
 * @param response - The response to check
 * @param currentTime - Current timestamp in milliseconds (defaults to Date.now())
 * @returns true if timeout exceeded, false otherwise
 */
export function checkRecordingTimeout(
  response: ResponseWithId,
  currentTime: number = Date.now()
): boolean {
  if (
    !response.recordingTimestampStart ||
    !response.pieceDuration ||
    response.recordingFinished
  ) {
    return false;
  }

  const elapsed = currentTime - response.recordingTimestampStart;
  const timeoutThreshold = response.pieceDuration + 2 * 60 * 1000; // duration + 2 minutes

  return elapsed > timeoutThreshold;
}

