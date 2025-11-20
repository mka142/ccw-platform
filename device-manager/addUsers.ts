import { ObjectId } from "mongodb";

import { config } from "./config";
import { initializeDb } from "./modules/db";
import { UserService } from "./modules/user/services/userService";

import type { DeviceType } from "./modules/user/types";

async function addUsers(count: number, deviceType: string) {
  await initializeDb({
    uri: config.database.url,
    databaseName: config.database.name,
  });
  if (count <= 0) {
    console.error("Count must be greater than 0.");
    return;
  }

  const concertId = new ObjectId(); // Replace with actual concert ID if needed
  const users = Array.from({ length: count }, () => ({
    deviceType: deviceType as DeviceType,
    isActive: true,
    lastPing: Date.now(),
  }));

  const userIds: string[] = [];

  for (const user of users) {
    const result = await UserService.createUser({
      ...user,
      concertId,
    });
    if (result.success) {
      userIds.push(result.data._id.toString());
    } else if ("error" in result) {
      console.error("Failed to add user:", result.error);
    }
  }

  console.log(`${users.length} users added successfully.`);
  console.log("User IDs:", JSON.stringify(userIds, null, 2));
}

const args = process.argv.slice(2);
const count = parseInt(args[0] ?? "0", 10);
const deviceType = args[1] ?? "";

const validDeviceTypes: DeviceType[] = ["Web", "M5Stack"];

if (count <= 0 || !deviceType) {
  console.error("Usage: bun run addUsers.ts <count> <deviceType>");
  process.exit(1);
}

if (!validDeviceTypes.includes(deviceType as DeviceType)) {
  console.error(`Invalid device type. Valid types are: ${validDeviceTypes.join(", ")}`);
  process.exit(1);
}

addUsers(count, deviceType).then(() => process.exit(0));
