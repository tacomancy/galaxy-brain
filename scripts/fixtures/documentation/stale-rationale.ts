// Rationale: this unrelated comment is intentionally too far from the cast.

const unrelatedBoundary = "not the cast";
void unrelatedBoundary;

export const staleRationale = (value: unknown): object => value as object;
