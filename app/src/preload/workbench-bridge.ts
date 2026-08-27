/**
 * Narrow renderer bridge for Workbench operations.
 *
 * The preload layer translates one typed operation into IPC; it does not
 * expose ipcRenderer, filesystem access, or application rules to the page.
 */
import { contextBridge, ipcRenderer } from "electron";

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
  RestoreSynthesisResultOutcome,
  SynthesisSavedResult,
} from "../modules/source-processing";

contextBridge.exposeInMainWorld("workbench", {
  // The main process owns session composition; the renderer receives only the
  // serializable state needed to render the current workspace.
  openFreshWorkbench: (): Promise<FreshWorkbench> =>
    ipcRenderer.invoke("workbench:open-fresh"),
  createRepository: (): Promise<RepositoryOperationOutcome> =>
    ipcRenderer.invoke("workbench:create-repository"),
  openRepository: (): Promise<RepositoryOperationOutcome> =>
    ipcRenderer.invoke("workbench:open-repository"),
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
  prepareSynthesis: (): Promise<PrepareSynthesisOutcome> =>
    ipcRenderer.invoke("workbench:prepare-synthesis"),
  confirmSynthesis: (
    confirmation: "confirmed" | "declined" | "canceled",
  ): Promise<ConfirmSynthesisOutcome> =>
    ipcRenderer.invoke("workbench:confirm-synthesis", confirmation),
  readSynthesisResults: (): Promise<SynthesisSavedResult[]> =>
    ipcRenderer.invoke("workbench:read-synthesis-results"),
  restoreSynthesisResult: (
    resultId: string,
    version: number,
  ): Promise<RestoreSynthesisResultOutcome> =>
    ipcRenderer.invoke("workbench:restore-synthesis-result", resultId, version),
});
