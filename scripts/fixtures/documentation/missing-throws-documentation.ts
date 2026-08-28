/**
 * Rejects the forbidden value.
 * @returns Nothing when the value is allowed.
 */
export const missingThrowsDocumentation = (value: boolean): void => {
  if (value) {
    throw new Error("forbidden");
  }
};
