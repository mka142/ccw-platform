import { ConcertService } from "@/modules/admin";
import { UserService } from "@/modules/user/services/userService";

/**
 * Periodic job to validate user status for active concerts
 * Checks M5Stack devices and deactivates them if they haven't pinged in the last 10 seconds
 */
export async function validateUserStatusJob() {
  try {
    // Get active concert
    const activeConcert = await ConcertService.findActiveConcert();
    
    if (!activeConcert) {
      console.log("[Job] No active concert found, skipping user status validation");
      return;
    }

    console.log(`[Job] Validating user status for concert: ${activeConcert.name}`);
    
    // Validate user status for the active concert
    await UserService.validateConcertUserStatus(activeConcert._id);
    
    console.log("[Job] User status validation completed");
  } catch (error) {
    console.error("[Job] Error during user status validation:", error);
  }
}
