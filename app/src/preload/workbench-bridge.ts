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
});
