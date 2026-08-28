/** Type declaration for the operation-specific API exposed by preload. */
import type {
  FreshWorkbench,
  ReadingPositionOutcome,
  RepositoryOperationOutcome,
  WorkbenchWorkspace,
  WorkspaceTransitionOutcome,
} from "../modules/workbench-session";
import type {
  ConfirmSynthesisOutcome,
  PrepareSynthesisOutcome,
  SynthesisResultListReadOutcome,
  RestoreSynthesisResultOutcome,
} from "../modules/source-processing";

declare global {
  interface Window {
    workbench: {
      // Keep renderer callers typed to the same public result as the preload
      // bridge and Workbench Session Module.
      openFreshWorkbench(): Promise<FreshWorkbench>;
      createRepository(): Promise<RepositoryOperationOutcome>;
      openRepository(): Promise<RepositoryOperationOutcome>;
      openTopicInStudio(topicId: string): Promise<WorkspaceTransitionOutcome>;
      openSourceRecordInPaperDesk(
        sourceRecordId: string,
      ): Promise<WorkspaceTransitionOutcome>;
      switchWorkspace(
        workspace: WorkbenchWorkspace,
      ): Promise<WorkspaceTransitionOutcome>;
      openSavedAnnotation(): Promise<ReadingPositionOutcome>;
      prepareSynthesis(
        includeAllContext: boolean,
      ): Promise<PrepareSynthesisOutcome>;
      removeSynthesisContextItem(
        annotationId: string,
      ): Promise<PrepareSynthesisOutcome>;
      confirmSynthesis(
        confirmation: "confirmed" | "declined" | "canceled",
      ): Promise<ConfirmSynthesisOutcome>;
      readSynthesisResults(): Promise<SynthesisResultListReadOutcome>;
      restoreSynthesisResult(
        resultId: string,
        version: number,
      ): Promise<RestoreSynthesisResultOutcome>;
    };
  }
}

export {};
