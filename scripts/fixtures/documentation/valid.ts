/** Filesystem and IPC seam rationale is intentionally documented in this fixture. */
import { writeFile } from "node:fs/promises";
import { ipcMain } from "electron";

/** A documented value crossing a public Module Interface. */
export interface ValidRecord {
  value: string;
}

/**
 * Creates one validated public record.
 * @param value The value to preserve in the record.
 * @returns The new record.
 */
export const createValidRecord = (value: string): ValidRecord => ({ value });

/**
 * Writes one value through a documented filesystem seam.
 * @param value The value to write.
 * @returns The completed write operation.
 */
export const writeValidRecord = async (value: string): Promise<void> => {
  // Rationale: the atomic Adapter preserves the previous file on failure.
  void writeFile;
  await Promise.resolve(value);
};

/**
 * Invokes one renderer operation through a documented IPC seam.
 * @returns Nothing.
 */
export const invokeValidOperation = (): void => {
  // IPC rationale: this operation uses a narrow, operation-specific bridge.
  void ipcMain;
};

// Rationale: this legacy value is confined to a validated external boundary.
const validLegacyValue: any = undefined;
void validLegacyValue;

// eslint-disable-next-line no-console -- Rationale: fixture verifies suppression documentation.
console.log("documented suppression");

// TODO(owner: maintainer, #999): replace this fixture with a real seam.
/**
 * Retains a deliberately tracked future decision.
 * @returns Nothing.
 */
export const validTrackedDecision = (): void => {};

/**
 * Reads an external value after validation.
 * @param value The external value.
 * @returns The validated record.
 */
export const readValidExternalValue = (value: unknown): ValidRecord => {
  // Rationale: the caller validates the unknown value at this external seam.
  return value as ValidRecord;
};

// Transaction rationale: the journal records the phase before replacement so
// interrupted writes can be completed or restored deterministically.
const validTransactionJournal = { state: "prepared" };

// Rollback rationale: exact prior bytes remain available until the applied
// record is durably installed.
const validRollbackBytes = "previous contents";

// Recovery rationale: recovery chooses completion or restoration from the
// persisted journal instead of guessing from an incomplete write.
const validRecoveryAction = "restored";
void validTransactionJournal;
void validRollbackBytes;
void validRecoveryAction;

/**
 * Demonstrates an operation with an expected programming error.
 * @returns Nothing when the operation is allowed to complete.
 * @throws Error when the caller supplies the forbidden value.
 */
export const throwValidError = (): void => {
  if (validRecoveryAction === "forbidden") {
    throw new Error("forbidden");
  }
};
