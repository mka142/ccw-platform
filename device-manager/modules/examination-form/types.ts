import type { BaseDocument, DocumentWithId, ObjectId } from "@/lib/types";

/**
 * Examination Form Module Types
 */

/**
 * Individual examination form answer
 */
export interface ExaminationFormAnswer {
  questionId: string;
  answer: string | string[] | number;
}

/**
 * Base examination form response schema
 */
interface ExaminationFormResponseSchema {
  userId: ObjectId;
  formId: string;
  answers: Record<string, any>;
}

/**
 * Base examination form response document (for creation)
 */
export interface ExaminationFormResponse extends BaseDocument, ExaminationFormResponseSchema {}

/**
 * Examination form response document with ID (from database)
 */
export interface ExaminationFormResponseWithId extends DocumentWithId, ExaminationFormResponseSchema {}

/**
 * API input format for creating examination form response
 */
export interface ExaminationFormInput {
  userId: string; // Will be converted to ObjectId and validated
  formId: string;
  answers: Record<string, any>;
}