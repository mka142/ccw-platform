import fs from "node:fs";
import { parseFile } from "music-metadata";

/**
 * Calculate audio file duration in milliseconds
 * @param audioFilePath - Path to the audio file
 * @returns Duration in milliseconds, or null if calculation fails
 */
export async function calculatePieceDuration(audioFilePath: string): Promise<number | null> {
  if (!fs.existsSync(audioFilePath)) {
    console.error(`[audioUtils] Audio file not found: ${audioFilePath}`);
    return null;
  }

  try {
    const metadata = await parseFile(audioFilePath);
    if (metadata.format.duration) {
      // Convert seconds to milliseconds
      return Math.round(metadata.format.duration * 1000);
    }
    return null;
  } catch (error) {
    console.error(`[audioUtils] Failed to get audio duration for ${audioFilePath}:`, error);
    return null;
  }
}

