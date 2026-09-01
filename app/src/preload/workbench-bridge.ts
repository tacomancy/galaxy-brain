/**
 * Narrow renderer bridge for Workbench operations.
 *
 * The preload layer translates one typed operation into IPC; it does not
 * expose ipcRenderer, filesystem access, or application rules to the page.
 */
import { contextBridge, ipcRenderer } from "electron";

import type {
  ReadingPositionOutcome,
  RepositoryOperationOutcome,
  WorkbenchContextSelection,
  WorkbenchContextSelectionOutcome,
  WorkbenchWorkspace,
  ThemeOperationOutcome,
  WorkbenchTheme,
  WorkspaceTransitionOutcome,
} from "../modules/workbench-session";
import type { WorkbenchViewState } from "../modules/workbench-view";
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
  DiscoveryJumpOutcome,
  DiscoveryContextCandidate,
  DiscoverySearchOutcome,
  PrepareAskRequest,
  PrepareAskOutcome,
} from "../modules/discovery";

contextBridge.exposeInMainWorld("workbench", {
  // The main process owns session composition; the renderer receives only the
  // serializable state needed to render the current workspace.
  openFreshWorkbench: (): Promise<WorkbenchViewState> =>
    ipcRenderer.invoke("workbench:open-fresh"),
  readSourceAvailability: (): Promise<
    CheckSourceAvailabilityOutcome | undefined
  > => ipcRenderer.invoke("workbench:read-source-availability"),
  relinkSource: (): Promise<RelinkSourceOperationOutcome> =>
    ipcRenderer.invoke("workbench:relink-source"),
  readAuthoringDraft: (): Promise<AuthoringReadOutcome> =>
    ipcRenderer.invoke("workbench:read-authoring-draft"),
  openAuthoringDraft: (): Promise<AuthoringReadOutcome> =>
    ipcRenderer.invoke("workbench:open-authoring-draft"),
  openAuthoringConstruct: (
    construct: AuthoringConstruct,
  ): Promise<AuthoringReadOutcome> =>
    ipcRenderer.invoke("workbench:open-authoring-construct", construct),
  editAuthoringSemanticText: (
    nextText: string,
  ): Promise<AuthoringOperationOutcome> =>
    ipcRenderer.invoke("workbench:edit-authoring-semantic-text", nextText),
  undoAuthoringSemanticText: (): Promise<AuthoringOperationOutcome> =>
    ipcRenderer.invoke("workbench:undo-authoring-semantic-text"),
  setAuthoringMode: (mode: AuthoringMode): Promise<AuthoringOperationOutcome> =>
    ipcRenderer.invoke("workbench:set-authoring-mode", mode),
  readProposalReview: (): Promise<ProposalReviewReadOutcome> =>
    ipcRenderer.invoke("workbench:read-proposal-review"),
  readAtlasOrientation: (): Promise<AtlasOrientationReadOutcome> =>
    ipcRenderer.invoke("workbench:read-atlas-orientation"),
  editLearningRouteTitle: (
    routeId: string,
    title: string,
  ): Promise<AtlasLearningRouteEditOutcome> =>
    ipcRenderer.invoke("workbench:edit-learning-route-title", routeId, title),
  readLearningProgress: (): Promise<LearningReadOutcome> =>
    ipcRenderer.invoke("workbench:read-learning-progress"),
  confirmLearningProgress: (
    suggestionId: string,
  ): Promise<LearningOperationOutcome> =>
    ipcRenderer.invoke("workbench:confirm-learning-progress", suggestionId),
  correctLearningProgress: (
    suggestionId: string,
    correction: string,
  ): Promise<LearningOperationOutcome> =>
    ipcRenderer.invoke(
      "workbench:correct-learning-progress",
      suggestionId,
      correction,
    ),
  openProposalReview: (): Promise<ProposalReviewReadOutcome> =>
    ipcRenderer.invoke("workbench:open-proposal-review"),
  acceptProposalReview: (): Promise<ProposalReviewApplyOutcome> =>
    ipcRenderer.invoke("workbench:accept-proposal-review"),
  createRepository: (): Promise<RepositoryOperationOutcome> =>
    ipcRenderer.invoke("workbench:create-repository"),
  openRepository: (): Promise<RepositoryOperationOutcome> =>
    ipcRenderer.invoke("workbench:open-repository"),
  selectWorkbenchContext: (
    selection: WorkbenchContextSelection,
  ): Promise<WorkbenchContextSelectionOutcome> =>
    ipcRenderer.invoke("workbench:select-context", selection),
  openTopicInStudio: (topicId: string): Promise<WorkspaceTransitionOutcome> =>
    ipcRenderer.invoke("workbench:open-topic-in-studio", topicId),
  openSourceRecordInPaperDesk: (
    sourceRecordId: string,
  ): Promise<WorkspaceTransitionOutcome> =>
    ipcRenderer.invoke(
      "workbench:open-source-record-in-paper-desk",
      sourceRecordId,
    ),
  switchWorkspace: (
    workspace: WorkbenchWorkspace,
  ): Promise<WorkspaceTransitionOutcome> =>
    ipcRenderer.invoke("workbench:switch-workspace", workspace),
  openSavedAnnotation: (): Promise<ReadingPositionOutcome> =>
    ipcRenderer.invoke("workbench:open-saved-annotation"),
  discoverySearch: (query: string): Promise<DiscoverySearchOutcome> =>
    ipcRenderer.invoke("workbench:discovery-search", query),
  discoveryAskContextCandidates: (): Promise<
    | { outcome: "available"; candidates: DiscoveryContextCandidate[] }
    | { outcome: "repository-unavailable"; detail: string }
  > => ipcRenderer.invoke("workbench:discovery-context-candidates"),
  prepareAsk: (request: PrepareAskRequest): Promise<PrepareAskOutcome> =>
    ipcRenderer.invoke("workbench:prepare-ask", request),
  removeAskContextItem: (itemId: string): Promise<PrepareAskOutcome> =>
    ipcRenderer.invoke("workbench:remove-ask-context-item", itemId),
  confirmAsk: (
    confirmation: "confirmed" | "declined" | "canceled",
  ): Promise<ConfirmAskOutcome> =>
    ipcRenderer.invoke("workbench:confirm-ask", confirmation),
  discoveryJump: (command: string): Promise<DiscoveryJumpOutcome> =>
    ipcRenderer.invoke("workbench:discovery-jump", command),
  prepareSynthesis: (
    includeAllContext: boolean,
  ): Promise<PrepareSynthesisOutcome> =>
    ipcRenderer.invoke("workbench:prepare-synthesis", includeAllContext),
  removeSynthesisContextItem: (
    annotationId: string,
  ): Promise<PrepareSynthesisOutcome> =>
    ipcRenderer.invoke("workbench:remove-synthesis-context-item", annotationId),
  confirmSynthesis: (
    confirmation: "confirmed" | "declined" | "canceled",
  ): Promise<ConfirmSynthesisOutcome> =>
    ipcRenderer.invoke("workbench:confirm-synthesis", confirmation),
  readSynthesisResults: (): Promise<SynthesisResultListReadOutcome> =>
    ipcRenderer.invoke("workbench:read-synthesis-results"),
  restoreSynthesisResult: (
    resultId: string,
    version: number,
  ): Promise<RestoreSynthesisResultOutcome> =>
    ipcRenderer.invoke("workbench:restore-synthesis-result", resultId, version),
  readTheme: (): Promise<WorkbenchTheme> =>
    ipcRenderer.invoke("workbench:read-theme"),
  setTheme: (theme: WorkbenchTheme): Promise<ThemeOperationOutcome> =>
    ipcRenderer.invoke("workbench:set-theme", theme),
});
