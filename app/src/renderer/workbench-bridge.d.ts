/** Type declaration for the operation-specific API exposed by preload. */
import type {
  FreshWorkbench,
  ReadingPositionOutcome,
  RepositoryOperationOutcome,
  WorkbenchContextSelection,
  WorkbenchContextSelectionOutcome,
  WorkbenchWorkspace,
  ThemeOperationOutcome,
  WorkbenchTheme,
  WorkspaceTransitionOutcome,
} from "../modules/workbench-session";
import type {
  ConfirmSynthesisOutcome,
  PrepareSynthesisOutcome,
  SynthesisResultListReadOutcome,
  RestoreSynthesisResultOutcome,
} from "../modules/source-processing";
import type {
  ProposalReviewApplyOutcome,
  ProposalReviewReadOutcome,
} from "../modules/proposal-review";
import type {
  AuthoringConstruct,
  AuthoringMode,
  AuthoringOperationOutcome,
  AuthoringReadOutcome,
} from "../modules/knowledge-authoring";

declare global {
  interface Window {
    workbench: {
      // Keep renderer callers typed to the same public result as the preload
      // bridge and Workbench Session Module.
      openFreshWorkbench(): Promise<FreshWorkbench>;
      readAuthoringDraft(): Promise<AuthoringReadOutcome>;
      openAuthoringDraft(): Promise<AuthoringReadOutcome>;
      openAuthoringConstruct(
        construct: AuthoringConstruct,
      ): Promise<AuthoringReadOutcome>;
      editAuthoringSemanticText(
        nextText: string,
      ): Promise<AuthoringOperationOutcome>;
      undoAuthoringSemanticText(): Promise<AuthoringOperationOutcome>;
      setAuthoringMode(mode: AuthoringMode): Promise<AuthoringOperationOutcome>;
      readProposalReview(): Promise<ProposalReviewReadOutcome>;
      openProposalReview(): Promise<ProposalReviewReadOutcome>;
      acceptProposalReview(): Promise<ProposalReviewApplyOutcome>;
      createRepository(): Promise<RepositoryOperationOutcome>;
      openRepository(): Promise<RepositoryOperationOutcome>;
      selectWorkbenchContext(
        selection: WorkbenchContextSelection,
      ): Promise<WorkbenchContextSelectionOutcome>;
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
      readTheme(): Promise<WorkbenchTheme>;
      setTheme(theme: WorkbenchTheme): Promise<ThemeOperationOutcome>;
    };
  }
}

export {};
