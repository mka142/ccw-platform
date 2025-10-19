/**
 * Base types for the generic library
 * These are fundamental types that can be used by any part of the system
 */

export type ObjectId = import("mongodb").ObjectId;

export interface BaseEntity {
  createdAt?: number;
  updatedAt?: number;
}

export interface BaseDocument extends BaseEntity {
  _id?: ObjectId;
}

export interface DocumentWithId extends BaseDocument {
  _id: ObjectId;
}

/**
 * Generic database operation results
 */
export type OperationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };
