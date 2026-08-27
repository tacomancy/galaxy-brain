import { contextBridge, ipcRenderer } from "electron";

import type { FreshWorkbench } from "../modules/workbench-session";

contextBridge.exposeInMainWorld("workbench", {
  openFreshWorkbench: (): Promise<FreshWorkbench> =>
    ipcRenderer.invoke("workbench:open-fresh"),
});
