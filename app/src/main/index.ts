/**
 * Electron composition root for the Knowledge Workbench.
 *
 * This process owns privileged operations and wires the renderer-facing
 * bridge to application Modules. Tracer Bullets 2 through 6 compose the
 * production file-backed repository and machine-local session-state Adapters
 * while remaining independent of Git, network, and provider state.
 */
import { app, BrowserWindow, dialog, ipcMain, protocol } from "electron";
import { readFile } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { createFileBackedKnowledgeRepository } from "../adapters/knowledge-repository/file-backed-knowledge-repository";
import { createFileBackedWorkbenchSessionState } from "../adapters/session-state/file-backed-workbench-session-state";
import { createFixturePdfAdapter } from "../adapters/pdf/fixture-pdf-adapter";
import { createFileBackedSynthesisResultRepository } from "../adapters/working-material/file-backed-synthesis-result-repository";
import { createFileBackedWorkingMaterialRepository } from "../adapters/working-material/file-backed-working-material-repository";
import { contentTypeFor } from "./renderer-asset-content-type";
import { createSourceProcessing } from "../modules/source-processing";
import type {
  ConfirmSynthesisOutcome,
  PrepareSynthesisOutcome,
  SynthesisPreview,
  SynthesisResultListReadOutcome,
  RestoreSynthesisResultOutcome,
  SynthesisResultReadOutcome,
} from "../modules/source-processing";
import { createWorkbenchSession } from "../modules/workbench-session";
import type { WorkbenchWorkspace } from "../modules/workbench-session";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const isWorkbenchWorkspace = (value: unknown): value is WorkbenchWorkspace =>
  value === "atlas" || value === "studio" || value === "paper-desk";

const isSynthesisConfirmation = (
  value: unknown,
): value is "confirmed" | "declined" | "canceled" =>
  value === "confirmed" || value === "declined" || value === "canceled";

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

// A custom secure scheme lets packaged renderer assets load without exposing
// a broad file:// surface to the sandboxed renderer.
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

// Forge can recreate the main process during development. Registering the
// handler only once prevents duplicate protocol registrations in that path.
let isRendererProtocolInstalled = false;

/**
 * Serves packaged renderer assets through the allow-listed custom scheme.
 * Requests outside the renderer root are rejected before any file is read.
 */
const installRendererProtocol = (rendererEntry: string): void => {
  if (isRendererProtocolInstalled) {
    return;
  }

  const rendererRoot = dirname(dirname(fileURLToPath(rendererEntry)));

  protocol.handle("galaxy-brain", async (request) => {
    const requestUrl = new URL(request.url);

    // Only the Workbench host is valid; this avoids turning the scheme into a
    // general-purpose local file server.
    if (requestUrl.hostname !== "workbench") {
      return new Response("Not found", { status: 404 });
    }

    const requestedPath = decodeURIComponent(requestUrl.pathname);
    const resolvedPath = resolve(rendererRoot, `.${requestedPath}`);

    // The prefix check prevents traversal outside the compiled renderer tree.
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

/** Creates the single BrowserWindow used by the current desktop shell. */
const createWindow = async (): Promise<void> => {
  const isSilentTestMode = process.argv.includes(
    "--galaxy-brain-test-mode=silent",
  );
  const starterRoot = app.isPackaged
    ? join(process.resourcesPath, "knowledge-repository")
    : join(app.getAppPath(), "templates", "knowledge-repository");
  const sessionStateArgument = process.argv.find((argument) =>
    argument.startsWith("--galaxy-brain-session-state="),
  );
  const sessionStatePath =
    sessionStateArgument?.slice("--galaxy-brain-session-state=".length) ??
    join(app.getPath("userData"), "workbench-session.json");
  const workbenchSession = createWorkbenchSession(
    createFileBackedKnowledgeRepository(starterRoot),
    createFileBackedWorkbenchSessionState(sessionStatePath),
  );
  let pendingSynthesis:
    { repositoryPath: string; preview: SynthesisPreview } | undefined;
  const prepareSynthesisPreview = async (
    includeAllContext: boolean,
  ): Promise<PrepareSynthesisOutcome> => {
    const workbench = await workbenchSession.openFreshWorkbench();

    if (
      workbench.repositoryPath === undefined ||
      workbench.context === undefined ||
      workbench.sourceAnnotation === undefined
    ) {
      return {
        outcome: "invalid-selection",
        detail: "A topic and saved source claim are required for Synthesis.",
      };
    }

    const workingMaterial = createFileBackedWorkingMaterialRepository(
      workbench.repositoryPath,
    );
    let selectedAnnotations = [workbench.sourceAnnotation];

    if (
      includeAllContext &&
      workingMaterial.readAnnotationsForSourceRecord !== undefined
    ) {
      const annotations = await workingMaterial.readAnnotationsForSourceRecord(
        workbench.context.sourceRecord.id,
      );

      if (annotations.outcome === "unavailable") {
        return {
          outcome: "invalid-selection",
          detail: annotations.detail,
        };
      }

      if (annotations.outcome === "found" && annotations.annotations.length) {
        selectedAnnotations = annotations.annotations;
      }
    }

    return createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial,
      results: createFileBackedSynthesisResultRepository(
        workbench.repositoryPath,
      ),
    }).prepareSynthesis({
      targetTopic: workbench.context.topic,
      selectedAnnotations,
      provider: {
        destination: "OpenAI API",
        model: "fixture-pinned-model",
      },
    });
  };
  const readSynthesisResults =
    async (): Promise<SynthesisResultListReadOutcome> => {
      const workbench = await workbenchSession.openFreshWorkbench();

      if (workbench.repositoryPath === undefined) {
        return { outcome: "found", results: [] };
      }

      const repository = createFileBackedSynthesisResultRepository(
        workbench.repositoryPath,
      );

      return (
        (await repository.readResults?.()) ?? {
          outcome: "found",
          results: [],
        }
      );
    };
  const mainWindow = new BrowserWindow({
    width: 1_200,
    height: 800,
    // The packaged S1 harness keeps the native window hidden while leaving
    // the renderer active for WebdriverIO's desktop-level assertions.
    show: !isSilentTestMode,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: true,
    },
  });

  // IPC is operation-specific and the sender is checked before the Module is
  // invoked, keeping renderer input from becoming arbitrary main-process
  // authority.
  ipcMain.handle("workbench:open-fresh", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return workbenchSession.openFreshWorkbench();
  });

  ipcMain.handle("workbench:create-repository", async (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    const selection = await dialog.showOpenDialog(mainWindow, {
      buttonLabel: "Create Repository",
      message: "Choose where to create the Knowledge Repository.",
      properties: ["openDirectory", "createDirectory"],
    });

    if (selection.canceled || selection.filePaths[0] === undefined) {
      return { outcome: "canceled" as const };
    }

    return workbenchSession.createRepository(selection.filePaths[0]);
  });

  ipcMain.handle("workbench:open-repository", async (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    const selection = await dialog.showOpenDialog(mainWindow, {
      buttonLabel: "Open Repository",
      message: "Choose a Knowledge Repository to open.",
      properties: ["openDirectory"],
    });

    if (selection.canceled || selection.filePaths[0] === undefined) {
      return { outcome: "canceled" as const };
    }

    return workbenchSession.openRepository(selection.filePaths[0]);
  });

  ipcMain.handle(
    "workbench:open-topic-in-studio",
    (event, topicId: unknown) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (typeof topicId !== "string" || topicId.length === 0) {
        throw new Error("Invalid Workbench topic transition.");
      }

      return workbenchSession.openTopicInStudio(topicId);
    },
  );

  ipcMain.handle(
    "workbench:open-source-record-in-paper-desk",
    (event, sourceRecordId: unknown) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (typeof sourceRecordId !== "string" || sourceRecordId.length === 0) {
        throw new Error("Invalid Workbench Source Record transition.");
      }

      return workbenchSession.openSourceRecordInPaperDesk(sourceRecordId);
    },
  );

  ipcMain.handle("workbench:switch-workspace", (event, workspace: unknown) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    if (!isWorkbenchWorkspace(workspace)) {
      throw new Error("Invalid Workbench workspace transition.");
    }

    return workbenchSession.switchWorkspace(workspace);
  });

  ipcMain.handle("workbench:open-saved-annotation", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return workbenchSession.openSavedAnnotation();
  });

  ipcMain.handle(
    "workbench:prepare-synthesis",
    async (event, includeAllContext: unknown) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (typeof includeAllContext !== "boolean") {
        throw new Error("Invalid Synthesis context selection.");
      }

      const prepared = await prepareSynthesisPreview(includeAllContext);

      pendingSynthesis =
        prepared.outcome === "preview-ready"
          ? {
              repositoryPath:
                (await workbenchSession.openFreshWorkbench()).repositoryPath ??
                "",
              preview: prepared.preview,
            }
          : undefined;

      return prepared;
    },
  );

  ipcMain.handle(
    "workbench:remove-synthesis-context-item",
    async (event, annotationId: unknown): Promise<PrepareSynthesisOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (typeof annotationId !== "string" || annotationId.length === 0) {
        throw new Error("Invalid Synthesis context item.");
      }

      if (pendingSynthesis === undefined) {
        return {
          outcome: "invalid-selection",
          detail: "Prepare the Synthesis request again before editing it.",
        };
      }

      const updated = await createSourceProcessing({
        pdf: createFixturePdfAdapter(),
        workingMaterial: createFileBackedWorkingMaterialRepository(
          pendingSynthesis.repositoryPath,
        ),
      }).removeSynthesisContextItem({
        preview: pendingSynthesis.preview,
        annotationId,
      });

      if (updated.outcome === "preview-ready") {
        pendingSynthesis = {
          ...pendingSynthesis,
          preview: updated.preview,
        };
      }

      return updated;
    },
  );

  ipcMain.handle(
    "workbench:confirm-synthesis",
    async (event, confirmation: unknown): Promise<ConfirmSynthesisOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (!isSynthesisConfirmation(confirmation)) {
        throw new Error("Invalid Synthesis confirmation.");
      }

      if (pendingSynthesis === undefined) {
        return {
          outcome: "operation-failed",
          detail:
            "The Synthesis preview is no longer available. Prepare it again.",
        };
      }

      const workbench = await workbenchSession.openFreshWorkbench();

      if (
        workbench.repositoryPath === undefined ||
        workbench.repositoryPath !== pendingSynthesis.repositoryPath
      ) {
        pendingSynthesis = undefined;
        return {
          outcome: "operation-failed",
          detail:
            "The Synthesis preview is no longer available. Prepare it again.",
        };
      }

      const preview = pendingSynthesis.preview;
      pendingSynthesis = undefined;

      return createSourceProcessing({
        pdf: createFixturePdfAdapter(),
        workingMaterial: createFileBackedWorkingMaterialRepository(
          workbench.repositoryPath,
        ),
      }).confirmSynthesis({
        preview,
        confirmation,
      });
    },
  );

  ipcMain.handle("workbench:read-synthesis-results", async (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return readSynthesisResults();
  });

  ipcMain.handle(
    "workbench:restore-synthesis-result",
    async (
      event,
      resultId: unknown,
      version: unknown,
    ): Promise<RestoreSynthesisResultOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (
        typeof resultId !== "string" ||
        resultId.length === 0 ||
        !isPositiveInteger(version)
      ) {
        throw new Error("Invalid Synthesis result restore.");
      }

      const workbench = await workbenchSession.openFreshWorkbench();

      if (workbench.repositoryPath === undefined) {
        return {
          outcome: "operation-failed",
          detail: "A Knowledge Repository must be selected first.",
        };
      }

      const results = createFileBackedSynthesisResultRepository(
        workbench.repositoryPath,
      );
      const readOutcome: SynthesisResultReadOutcome =
        (await results.readResult?.(resultId)) ?? {
          outcome: "unavailable",
          detail: "The Synthesis result could not be read.",
        };

      if (readOutcome.outcome !== "found") {
        return {
          outcome: "operation-failed",
          detail: readOutcome.detail,
        };
      }

      return createSourceProcessing({
        pdf: createFixturePdfAdapter(),
        workingMaterial: createFileBackedWorkingMaterialRepository(
          workbench.repositoryPath,
        ),
        results,
      }).restoreSynthesisResult({
        currentResult: readOutcome.result,
        version,
      });
    },
  );

  mainWindow.once("closed", () => {
    // The handler is scoped to this window and must not outlive it.
    ipcMain.removeHandler("workbench:open-fresh");
    ipcMain.removeHandler("workbench:create-repository");
    ipcMain.removeHandler("workbench:open-repository");
    ipcMain.removeHandler("workbench:open-topic-in-studio");
    ipcMain.removeHandler("workbench:open-source-record-in-paper-desk");
    ipcMain.removeHandler("workbench:switch-workspace");
    ipcMain.removeHandler("workbench:open-saved-annotation");
    ipcMain.removeHandler("workbench:prepare-synthesis");
    ipcMain.removeHandler("workbench:remove-synthesis-context-item");
    ipcMain.removeHandler("workbench:confirm-synthesis");
    ipcMain.removeHandler("workbench:read-synthesis-results");
    ipcMain.removeHandler("workbench:restore-synthesis-result");
  });

  if (MAIN_WINDOW_WEBPACK_ENTRY.startsWith("file:")) {
    const rendererEntry = fileURLToPath(MAIN_WINDOW_WEBPACK_ENTRY);
    installRendererProtocol(MAIN_WINDOW_WEBPACK_ENTRY);

    // Packaged builds use the custom scheme; development builds can load the
    // Forge-provided entry directly.
    await mainWindow.loadURL(
      `galaxy-brain://workbench/main_window/${basename(rendererEntry)}`,
    );
    return;
  }

  await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

// Wait for Electron's lifecycle before creating windows or registering window
// content that depends on the ready application state.
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // macOS conventionally keeps the application alive until explicitly quit.
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // Recreate the window when the user reactivates the app after closing it on
  // macOS, while preserving the normal single-window behavior.
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});
