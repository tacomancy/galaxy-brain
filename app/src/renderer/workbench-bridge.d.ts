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
  CheckSourceAvailabilityOutcome,
  ConfirmSynthesisOutcome,
  PrepareSynthesisOutcome,
  RelinkSourceOperationOutcome,
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
import type {
  AtlasLearningRouteEditOutcome,
  AtlasOrientationReadOutcome,
} from "../modules/atlas-orientation";
import type {
  LearningOperationOutcome,
  LearningReadOutcome,
} from "../modules/learning";
import type {
  ConfirmAskOutcome,
  DiscoveryContextCandidate,
  DiscoveryJumpOutcome,
  DiscoverySearchOutcome,
  PrepareAskRequest,
  PrepareAskOutcome,
} from "../modules/discovery";

declare global {
  interface Window {
    workbench: {
      // Keep renderer callers typed to the same public result as the preload
      // bridge and Workbench Session Module.
      openFreshWorkbench(): Promise<FreshWorkbench>;
      readSourceAvailability(): Promise<
        CheckSourceAvailabilityOutcome | undefined
      >;
      relinkSource(): Promise<RelinkSourceOperationOutcome>;
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
      readAtlasOrientation(): Promise<AtlasOrientationReadOutcome>;
      editLearningRouteTitle(
        routeId: string,
        title: string,
      ): Promise<AtlasLearningRouteEditOutcome>;
      readLearningProgress(): Promise<LearningReadOutcome>;
      confirmLearningProgress(
        suggestionId: string,
      ): Promise<LearningOperationOutcome>;
      correctLearningProgress(
        suggestionId: string,
        correction: string,
      ): Promise<LearningOperationOutcome>;
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
      discoverySearch(query: string): Promise<DiscoverySearchOutcome>;
      discoveryAskContextCandidates(): Promise<
        | { outcome: "available"; candidates: DiscoveryContextCandidate[] }
        | { outcome: "repository-unavailable"; detail: string }
      >;
      prepareAsk(request: PrepareAskRequest): Promise<PrepareAskOutcome>;
      removeAskContextItem(itemId: string): Promise<PrepareAskOutcome>;
      confirmAsk(
        confirmation: "confirmed" | "declined" | "canceled",
      ): Promise<ConfirmAskOutcome>;
      discoveryJump(command: string): Promise<DiscoveryJumpOutcome>;
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
