import { writeFile } from "node:fs/promises";

/**
 * Writes one value.
 * @param value The value to write.
 * @returns The write operation.
 */
export const undocumentedFilesystemWrite = (value: string): Promise<void> =>
  writeFile("output.txt", value);
