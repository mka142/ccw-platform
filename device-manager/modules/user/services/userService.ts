import { ConcertService, type ConcertWithId } from "@/modules/admin";

import { UserOperations } from "../db";

import type { DeviceType, User } from "../types";
import type { ObjectId, OperationResult } from "@/lib/types";

/**
 * User Service - Business Logic Layer
 * Handles user-related business operations
 */
export class UserService {
  static async getUsersByConcert(concertId: string | ObjectId): Promise<User[]> {
    return UserOperations.findByConcert(concertId);
  }

  static async createUser(userData: User) {
    return UserOperations.create(userData);
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<OperationResult<User | null>> {
    return UserOperations.updateById(id, updates);
  }

  static async deleteUser(id: string): Promise<OperationResult<boolean>> {
    return UserOperations.deleteById(id);
  }

  static async updateDeviceStatus(userId: string, isActive: boolean): Promise<OperationResult<User | null>> {
    return UserOperations.updateById(userId, {
      isActive,
      lastPing: Date.now(),
    });
  }

  static async findById(userId: string | ObjectId): Promise<User | null> {
    return UserOperations.findById(userId);
  }

  static async getActiveUsers(concertId: string | ObjectId): Promise<User[]> {
    const users = await UserOperations.findByConcert(concertId);
    return users.filter((user) => user.isActive);
  }

  static async validateConcertUserStatus(concertId: string | ObjectId): Promise<void> {
    const users = await UserOperations.findByConcert(concertId);
    const now = Date.now();
    const TIMEOUT_MS = 10000; // 10 seconds

    for (const user of users) {
      if (user.deviceType === "M5Stack" && user.lastPing) {
        const timeDiff = now - user.lastPing;
        if (timeDiff > TIMEOUT_MS && user.isActive) {
          await UserOperations.updateById(user._id.toString(), { isActive: false });
        }
      }
    }
  }

  static async validateUser(userId: string | ObjectId): Promise<boolean> {
    try {
      const user = await UserOperations.findById(userId);
      if (!user) {
        return false;
      }

      const activeConcert = await ConcertService.findActiveConcert();
      if (!activeConcert) {
        return false;
      }

      return user.concertId.equals(activeConcert._id);
    } catch (error) {
      console.error("Failed to validate user:", error);
      return false;
    }
  }

  static async updateUserStatus(userId: string, isActive: boolean): Promise<OperationResult<User | null>> {
    return UserOperations.updateById(userId, {
      isActive,
      lastPing: isActive ? Date.now() : undefined,
    });
  }

  static async acquireUser(userId: string | undefined, deviceType: DeviceType): Promise<OperationResult<User | null>> {
    // get active concert
    const activeConcertOrNull = await ConcertService.findActiveConcert();
    if (!activeConcertOrNull) {
      return { success: false, error: "No active concert found" };
    }
    const activeConcert: ConcertWithId = activeConcertOrNull;
    if (userId) {
      // Try to find existing user
      const existingUser = await UserOperations.findById(userId);
      const isUserSameConcert = existingUser?.concertId?.equals(activeConcert._id);
      if (isUserSameConcert) {
        return { success: true, data: existingUser };
      }
    }
    // Create new user
    const newUser: User = {
      concertId: activeConcert._id,
      deviceType,
      isActive: false,
      lastPing: undefined,
    };
    const result = await UserOperations.create(newUser);
    return result;
  }
}
