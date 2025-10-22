import { UserOperations } from "../db";

import type { User } from "../types";
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

  static async getActiveUsers(concertId: string | ObjectId): Promise<User[]> {
    const users = await UserOperations.findByConcert(concertId);
    return users.filter((user) => user.isActive);
  }

  static async updateUserStatus(userId: string, isActive: boolean): Promise<OperationResult<User | null>> {
    return UserOperations.updateById(userId, {
      isActive,
      lastPing: isActive ? Date.now() : undefined,
    });
  }
}
