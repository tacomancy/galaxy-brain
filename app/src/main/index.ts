import { app, BrowserWindow, ipcMain, protocol } from "electron";
import { readFile } from "node:fs/promises";
import { basename, dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { createInMemoryKnowledgeRepository } from "../adapters/knowledge-repository/in-memory-knowledge-repository";
import { createWorkbenchSession } from "../modules/workbench-session";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

protocol.registerSchemesAsPrivileged([
  {
    scheme: "galaxy-brain",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
  },
]);

const workbenchSession = createWorkbenchSession(
  createInMemoryKnowledgeRepository(),
);

let isRendererProtocolInstalled = false;

const contentTypeFor = (path: string): string => {
  switch (extname(path)) {
    case ".html":
      return "text/html; charset=UTF-8";
    case ".js":
      return "text/javascript; charset=UTF-8";
    default:
      return "application/octet-stream";
  }
};

const installRendererProtocol = (rendererEntry: string): void => {
  if (isRendererProtocolInstalled) {
    return;
  }

  const rendererRoot = dirname(dirname(fileURLToPath(rendererEntry)));

  protocol.handle("galaxy-brain", async (request) => {
    const requestUrl = new URL(request.url);

    if (requestUrl.hostname !== "workbench") {
      return new Response("Not found", { status: 404 });
    }

    const requestedPath = decodeURIComponent(requestUrl.pathname);
    const resolvedPath = resolve(rendererRoot, `.${requestedPath}`);

    if (
      !resolvedPath.startsWith(`${rendererRoot}${sep}`) &&
      resolvedPath !== rendererEntry
    ) {
      return new Response("Not found", { status: 404 });
    }

    try {
      return new Response(await readFile(resolvedPath), {
        headers: {
          "content-type": contentTypeFor(resolvedPath),
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });

  isRendererProtocolInstalled = true;
};

const createWindow = async (): Promise<void> => {
  const mainWindow = new BrowserWindow({
    width: 1_200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: true,
    },
  });

  ipcMain.handle("workbench:open-fresh", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return workbenchSession.openFreshWorkbench();
  });

  mainWindow.once("closed", () => {
    ipcMain.removeHandler("workbench:open-fresh");
  });

  if (MAIN_WINDOW_WEBPACK_ENTRY.startsWith("file:")) {
    const rendererEntry = fileURLToPath(MAIN_WINDOW_WEBPACK_ENTRY);
    installRendererProtocol(MAIN_WINDOW_WEBPACK_ENTRY);

    await mainWindow.loadURL(
      `galaxy-brain://workbench/main_window/${basename(rendererEntry)}`,
    );
    return;
  }

  await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
