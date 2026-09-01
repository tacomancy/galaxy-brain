import type {
  SourceProcessing,
  StructuredAnnotation,
} from "../source-processing";
import type { WorkbenchState } from "../workbench-session";

/** Renderer-facing Workbench projection composed from session and source state. */
export interface WorkbenchViewState extends WorkbenchState {
  /** Source-derived Working Material, not Session-owned state. */
  sourceAnnotation?: StructuredAnnotation;
}

/**
 * Composes source-derived state without making it part of Workbench Session.
 * @param workbench Session-owned selection and navigation state.
 * @param sourceProcessing Source Processing Interface for source-bound reads.
 * @returns A renderer-facing projection with an optional saved annotation.
 */
export const composeWorkbenchViewState = async (
  workbench: WorkbenchState,
  sourceProcessing: Pick<SourceProcessing, "readSavedAnnotation"> | undefined,
): Promise<WorkbenchViewState> => {
  if (workbench.context === undefined || sourceProcessing === undefined) {
    return workbench;
  }

  const annotation = await sourceProcessing.readSavedAnnotation(
    workbench.context.sourceRecord.id,
  );

  return annotation.outcome === "found"
    ? { ...workbench, sourceAnnotation: annotation.annotation }
    : workbench.activeWorkspace === "atlas"
      ? workbench
      : (() => {
          const withoutPosition = { ...workbench };
          delete withoutPosition.readingPosition;
          return { ...withoutPosition, activeWorkspace: "atlas" };
        })();
};
