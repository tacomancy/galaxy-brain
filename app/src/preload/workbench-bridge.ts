/**
 * Narrow renderer bridge for Workbench operations.
 *
 * The preload layer translates one typed operation into IPC; it does not
 * expose ipcRenderer, filesystem access, or application rules to the page.
 */
import { contextBridge, ipcRenderer } from "electron";

import type { FreshWorkbench } from "../modules/workbench-session";

contextBridge.exposeInMainWorld("workbench", {
  // The main process owns session composition; the renderer receives only the
  // serializable state needed to render Atlas.
  openFreshWorkbench: (): Promise<FreshWorkbench> =>
    ipcRenderer.invoke("workbench:open-fresh"),
});
