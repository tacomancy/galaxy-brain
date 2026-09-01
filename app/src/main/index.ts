/**
 * Electron composition root for the Knowledge Workbench.
 *
 * This process owns privileged operations and wires the renderer-facing
 * bridge to application Modules. Tracer Bullets 2 through 6 compose the
 * production file-backed repository and machine-local session-state Adapters
 * while remaining independent of Git, network, and provider state. Filesystem
 * and IPC handling remains behind narrow, validated seams.
 */
import { app, BrowserWindow, dialog, ipcMain, protocol } from "electron";
import { readFile } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createFileBackedKnowledgeRepository } from "../adapters/knowledge-repository/file-backed-knowledge-repository";
import {
  createEmptyAuthoringDraftSource,
  createFixtureAuthoringDraftSource,
} from "../adapters/knowledge-authoring/fixture-authoring-draft";
import {
  createEmptyProposalReviewSource,
  createFixtureProposalReviewSource,
  fixtureGovernedTarget,
} from "../adapters/proposal-review/fixture-proposal-review";
import { createFileBackedGovernanceStore } from "../adapters/governance/file-backed-governance-store";
import { createFileBackedWorkbenchSessionState } from "../adapters/session-state/file-backed-workbench-session-state";
import { createFixturePdfAdapter } from "../adapters/pdf/fixture-pdf-adapter";
import { createFileBackedSourceAssetAdapter } from "../adapters/pdf/file-backed-source-asset-adapter";
import { createPdfJsAdapter } from "../adapters/pdf/pdfjs-pdf-adapter";
import { createFileBackedSynthesisResultRepository } from "../adapters/working-material/file-backed-synthesis-result-repository";
import { createFileBackedWorkingMaterialRepository } from "../adapters/working-material/file-backed-working-material-repository";
import {
  createEmptyAtlasOrientationSource,
  createFixtureAtlasOrientationSource,
} from "../adapters/atlas-orientation/fixture-atlas-orientation";
import {
  createFixtureLearningStateSource,
  createFixtureLearningSuggestionProvider,
  createUnavailableLearningSuggestionProvider,
} from "../adapters/learning/fixture-learning";
import {
  createAtlasOrientation,
  type AtlasLearningRouteEditOutcome,
  type AtlasOrientationReadOutcome,
} from "../modules/atlas-orientation";
import {
  createLearning,
  type LearningOperationOutcome,
  type LearningReadOutcome,
} from "../modules/learning";
import { createFileBackedDiscoveryRepository } from "../adapters/discovery/file-backed-discovery-repository";
import { createFixtureDiscoveryModelAdapter } from "../adapters/discovery/fixture-discovery-model";
import { createInMemoryDiscoveryRepository } from "../adapters/discovery/in-memory-discovery-repository";
import { createGovernance } from "../modules/governance";
import { contentTypeFor } from "./renderer-asset-content-type";
import {
  createKnowledgeAuthoring,
  type AuthoringConstruct,
  type AuthoringMode,
  type AuthoringOperationOutcome,
  type AuthoringReadOutcome,
  type KnowledgeAuthoring,
} from "../modules/knowledge-authoring";
import { createSourceProcessing } from "../modules/source-processing";
import {
  createDiscovery,
  type AskPreview,
  type ConfirmAskOutcome,
  type DiscoveryJumpOutcome,
  type DiscoverySearchOutcome,
  type PrepareAskOutcome,
} from "../modules/discovery";
import {
  createProposalReview,
  type ProposalReview,
  type ProposalReviewApplyOutcome,
  type ProposalReviewReadOutcome,
} from "../modules/proposal-review";
import type {
  ConfirmSynthesisOutcome,
  CheckSourceAvailabilityOutcome,
  PrepareSynthesisOutcome,
  RelinkSourceOperationOutcome,
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

let injectedFailureConsumed = false;

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

const recordMainDiagnostic = (
  operation: string,
  phase: "bridge" | "window",
  category: "unexpected-rejection" | "startup-failure",
): void => {
  const timestamp = new Date().toISOString();
  // Keep diagnostics deliberately structured and non-sensitive. The renderer
  // receives only a safe generic recovery outcome, never this record or the
  // underlying exception.
  console.error(
    "Galaxy Brain diagnostic",
    JSON.stringify({
      operation,
      phase,
      category,
      timestamp,
    }),
  );
};

const workbenchIpcChannels = [
  "workbench:open-fresh",
  "workbench:read-source-availability",
  "workbench:relink-source",
  "workbench:read-theme",
  "workbench:set-theme",
  "workbench:read-authoring-draft",
  "workbench:open-authoring-draft",
  "workbench:edit-authoring-semantic-text",
  "workbench:undo-authoring-semantic-text",
  "workbench:open-authoring-construct",
  "workbench:set-authoring-mode",
  "workbench:read-proposal-review",
  "workbench:read-atlas-orientation",
  "workbench:edit-learning-route-title",
  "workbench:read-learning-progress",
  "workbench:confirm-learning-progress",
  "workbench:correct-learning-progress",
  "workbench:open-proposal-review",
  "workbench:accept-proposal-review",
  "workbench:create-repository",
  "workbench:open-repository",
  "workbench:select-context",
  "workbench:open-topic-in-studio",
  "workbench:open-source-record-in-paper-desk",
  "workbench:switch-workspace",
  "workbench:open-saved-annotation",
  "workbench:discovery-search",
  "workbench:discovery-context-candidates",
  "workbench:prepare-ask",
  "workbench:remove-ask-context-item",
  "workbench:confirm-ask",
  "workbench:discovery-jump",
  "workbench:prepare-synthesis",
  "workbench:remove-synthesis-context-item",
  "workbench:confirm-synthesis",
  "workbench:read-synthesis-results",
  "workbench:restore-synthesis-result",
] as const;

const removeWorkbenchIpcHandlers = (): void => {
  workbenchIpcChannels.forEach((channel) => ipcMain.removeHandler(channel));
};

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
  const isHumanReviewMode = process.argv.includes(
    "--galaxy-brain-test-mode=review",
  );
  const isProviderUnavailableTestMode = process.argv.includes(
    "--galaxy-brain-test-mode=provider-unavailable",
  );
  const failureArgument = process.argv.find((argument) =>
    argument.startsWith("--galaxy-brain-test-failure="),
  );
  const configuredFailure = failureArgument?.slice(
    "--galaxy-brain-test-failure=".length,
  );
  const maybeInjectFailure = (operation: string): void => {
    if (configuredFailure !== operation || injectedFailureConsumed) {
      return;
    }
    injectedFailureConsumed = true;
    throw new Error(`Injected ${operation} failure.`);
  };
  maybeInjectFailure("create-window");
  const isFixtureMode =
    isSilentTestMode || isHumanReviewMode || isProviderUnavailableTestMode;
  const starterRoot = app.isPackaged
    ? join(process.resourcesPath, "knowledge-repository")
    : join(app.getAppPath(), "templates", "knowledge-repository");
  const sessionStateArgument = process.argv.find((argument) =>
    argument.startsWith("--galaxy-brain-session-state="),
  );
  const sessionStatePath =
    sessionStateArgument?.slice("--galaxy-brain-session-state=".length) ??
    join(app.getPath("userData"), "workbench-session.json");
  const sourceAssetsArgument = process.argv.find((argument) =>
    argument.startsWith("--galaxy-brain-source-assets="),
  );
  const defaultSourceAssetsPath = join(
    app.getPath("userData"),
    "source-assets.json",
  );
  // The isolated source-store override is test/review-only; normal launches
  // always keep linked paths and hashes in Electron's private user-data root.
  const sourceAssetsPath =
    isFixtureMode && sourceAssetsArgument !== undefined
      ? sourceAssetsArgument.slice("--galaxy-brain-source-assets=".length)
      : defaultSourceAssetsPath;
  const pdfjsRoot = app.isPackaged
    ? join(process.resourcesPath, "pdfjs-dist")
    : join(app.getAppPath(), "node_modules", "pdfjs-dist");
  const productionPdf = createPdfJsAdapter({
    modulePath: pathToFileURL(join(pdfjsRoot, "legacy", "build", "pdf.mjs"))
      .href,
    standardFontDataUrl: pathToFileURL(
      `${join(pdfjsRoot, "standard_fonts")}${sep}`,
    ).href,
  });
  const sourceAsset = createFileBackedSourceAssetAdapter({
    configurationPath: sourceAssetsPath,
    pdf: productionPdf,
  });
  const sourceProcessingFor = (repositoryPath: string) =>
    createSourceProcessing({
      pdf: productionPdf,
      sourceAsset,
      workingMaterial:
        createFileBackedWorkingMaterialRepository(repositoryPath),
    });
  const discoveryFor = async () => {
    const workbench = await workbenchSession.openFreshWorkbench();
    const repository =
      workbench.repositoryPath === undefined
        ? createInMemoryDiscoveryRepository([])
        : createFileBackedDiscoveryRepository(workbench.repositoryPath);
    return createDiscovery({
      repository,
      ...(isFixtureMode ? { model: createFixtureDiscoveryModelAdapter() } : {}),
    });
  };
  const workbenchSession = createWorkbenchSession(
    createFileBackedKnowledgeRepository(starterRoot),
    createFileBackedWorkbenchSessionState(sessionStatePath),
  );
  const atlasOrientation = createAtlasOrientation(
    isFixtureMode
      ? createFixtureAtlasOrientationSource()
      : createEmptyAtlasOrientationSource(),
  );
  const learning = createLearning({
    state: isFixtureMode
      ? createFixtureLearningStateSource()
      : {
          async read() {
            return undefined;
          },
        },
    suggestionProvider: isProviderUnavailableTestMode
      ? createUnavailableLearningSuggestionProvider()
      : isFixtureMode
        ? createFixtureLearningSuggestionProvider()
        : createUnavailableLearningSuggestionProvider(),
  });
  let authoringRepositoryPath: string | undefined;
  let authoring: KnowledgeAuthoring | undefined;
  const getAuthoring = async (): Promise<KnowledgeAuthoring | undefined> => {
    const workbench = await workbenchSession.openFreshWorkbench();

    if (workbench.repositoryPath === undefined) {
      return undefined;
    }

    if (
      authoring !== undefined &&
      authoringRepositoryPath === workbench.repositoryPath
    ) {
      return authoring;
    }

    authoringRepositoryPath = workbench.repositoryPath;
    authoring = createKnowledgeAuthoring(
      isFixtureMode
        ? createFixtureAuthoringDraftSource()
        : createEmptyAuthoringDraftSource(),
    );
    return authoring;
  };
  const readAuthoringDraft = async (): Promise<AuthoringReadOutcome> =>
    (await getAuthoring())?.readDraft() ?? {
      outcome: "not-available",
      detail: "A Knowledge Repository must be selected first.",
    };
  const editAuthoringSemanticText = async (
    nextText: string,
  ): Promise<AuthoringOperationOutcome> =>
    (await getAuthoring())?.editSemanticText(nextText) ?? {
      outcome: "not-available",
      detail: "A Knowledge Repository must be selected first.",
    };
  const undoAuthoringSemanticText =
    async (): Promise<AuthoringOperationOutcome> =>
      (await getAuthoring())?.undoLastEdit() ?? {
        outcome: "not-available",
        detail: "A Knowledge Repository must be selected first.",
      };
  const setAuthoringMode = async (
    mode: AuthoringMode,
  ): Promise<AuthoringOperationOutcome> =>
    (await getAuthoring())?.setMode(mode) ?? {
      outcome: "not-available",
      detail: "A Knowledge Repository must be selected first.",
    };
  const openAuthoringConstruct = async (
    construct: AuthoringConstruct,
  ): Promise<AuthoringReadOutcome> =>
    (await getAuthoring())?.openConstruct(construct) ?? {
      outcome: "not-available",
      detail: "A Knowledge Repository must be selected first.",
    };
  let proposalReviewRepositoryPath: string | undefined;
  let proposalReview: ProposalReview | undefined;
  const getProposalReview = async (): Promise<ProposalReview | undefined> => {
    const workbench = await workbenchSession.openFreshWorkbench();

    if (
      workbench.repositoryPath === undefined ||
      workbench.repositoryAccess !== "read-write"
    ) {
      return undefined;
    }

    if (
      proposalReview !== undefined &&
      proposalReviewRepositoryPath === workbench.repositoryPath
    ) {
      return proposalReview;
    }

    proposalReviewRepositoryPath = workbench.repositoryPath;
    proposalReview = createProposalReview({
      governance: createGovernance({
        store: createFileBackedGovernanceStore({
          repositoryPath: workbench.repositoryPath,
          target: fixtureGovernedTarget,
          initialVersionId: "bayesian-statistics-v1",
          nextVersionId: "bayesian-statistics-v2",
        }),
      }),
      source: isFixtureMode
        ? createFixtureProposalReviewSource()
        : createEmptyProposalReviewSource(),
    });
    return proposalReview;
  };
  const readProposalReview = async (): Promise<ProposalReviewReadOutcome> =>
    (await getProposalReview())?.read() ?? { outcome: "not-available" };
  const acceptProposalReview = async (): Promise<ProposalReviewApplyOutcome> =>
    (await getProposalReview())?.acceptAndApply() ?? {
      outcome: "operation-failed",
      detail: "A read-write Knowledge Repository is required for review.",
    };
  const readSourceAvailability = async (): Promise<
    CheckSourceAvailabilityOutcome | undefined
  > => {
    const workbench = await workbenchSession.openFreshWorkbench();

    if (
      workbench.repositoryPath === undefined ||
      workbench.context === undefined
    ) {
      return undefined;
    }

    return sourceProcessingFor(
      workbench.repositoryPath,
    ).checkSourceAvailability({
      sourceRecord: workbench.context.sourceRecord,
    });
  };
  let pendingReplacementReference: string | undefined;
  const relinkSource = async (): Promise<RelinkSourceOperationOutcome> => {
    const workbench = await workbenchSession.openFreshWorkbench();

    if (
      workbench.repositoryPath === undefined ||
      workbench.context === undefined ||
      workbench.sourceAnnotation === undefined
    ) {
      return {
        outcome: "source-status-unavailable",
        sourceRecord: workbench.context?.sourceRecord ?? {
          id: "unknown-source",
          title: "Current Source Record",
        },
        warning: "source status unavailable",
        detail: "A Source Record with a known locator is required to relink.",
      };
    }

    let replacementReference = pendingReplacementReference;
    if (replacementReference === undefined) {
      const selection = await dialog.showOpenDialog(mainWindow, {
        buttonLabel: "Verify and Relink PDF",
        message: "Choose the replacement PDF for this Source Record.",
        properties: ["openFile"],
        filters: [{ name: "PDF documents", extensions: ["pdf"] }],
      });

      if (selection.canceled || selection.filePaths[0] === undefined) {
        return { outcome: "canceled" };
      }

      replacementReference = selection.filePaths[0];
    }

    try {
      pendingReplacementReference = replacementReference;
      const replacementIdentity =
        await sourceAsset.readReferenceIdentity(replacementReference);

      if (replacementIdentity.outcome === "unavailable") {
        pendingReplacementReference = undefined;
        return {
          outcome: "source-status-unavailable",
          sourceRecord: { ...workbench.context.sourceRecord },
          warning: "source status unavailable",
          detail: replacementIdentity.detail,
        };
      }

      const outcome = await sourceProcessingFor(
        workbench.repositoryPath,
      ).relinkSource({
        sourceRecord: workbench.context.sourceRecord,
        replacementReference,
        expectedReplacementSourceIdentity:
          replacementIdentity.current.sourceIdentity,
        expectedReplacementContentIdentity:
          replacementIdentity.current.contentIdentity,
        verificationLocator: workbench.sourceAnnotation.sourceLocator,
      });
      pendingReplacementReference = undefined;
      return outcome;
    } catch (cause: unknown) {
      pendingReplacementReference = replacementReference;
      throw cause;
    }
  };
  let pendingSynthesis:
    { repositoryPath: string; preview: SynthesisPreview } | undefined;
  let pendingAsk: { repositoryPath: string; preview: AskPreview } | undefined;
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
      maybeInjectFailure("synthesis-results-read");
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

  let pendingOpenRepositoryPath: string | undefined;
  let pendingCreateRepositoryPath: string | undefined;

  const registerIpcHandler = (
    channel: string,
    handler: (
      event: Electron.IpcMainInvokeEvent,
      ...args: unknown[]
    ) => unknown,
  ): void => {
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        return await handler(event, ...args);
      } catch {
        recordMainDiagnostic(channel, "bridge", "unexpected-rejection");
        throw new Error("Workbench operation could not be completed.");
      }
    });
  };

  // IPC is operation-specific and the sender is checked before the Module is
  // invoked, keeping renderer input from becoming arbitrary main-process
  // authority.
  registerIpcHandler("workbench:open-fresh", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    maybeInjectFailure("bootstrap");
    return workbenchSession.openFreshWorkbench();
  });

  registerIpcHandler("workbench:read-source-availability", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return readSourceAvailability();
  });

  registerIpcHandler("workbench:relink-source", async (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return relinkSource();
  });

  registerIpcHandler("workbench:read-theme", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return workbenchSession.readTheme();
  });

  registerIpcHandler("workbench:set-theme", (event, theme: unknown) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    if (theme !== "light" && theme !== "dark") {
      throw new Error("Invalid Workbench theme.");
    }

    return workbenchSession.setTheme(theme);
  });

  registerIpcHandler("workbench:read-authoring-draft", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return readAuthoringDraft();
  });

  registerIpcHandler("workbench:open-authoring-draft", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return readAuthoringDraft();
  });

  registerIpcHandler(
    "workbench:edit-authoring-semantic-text",
    (event, nextText: unknown) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (typeof nextText !== "string") {
        throw new Error("Invalid authoring semantic text.");
      }

      return editAuthoringSemanticText(nextText);
    },
  );

  registerIpcHandler("workbench:undo-authoring-semantic-text", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return undoAuthoringSemanticText();
  });

  registerIpcHandler(
    "workbench:open-authoring-construct",
    (event, construct: unknown) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (
        construct !== "highlight" &&
        construct !== "link" &&
        construct !== "embed" &&
        construct !== "callout" &&
        construct !== "equation" &&
        construct !== "citation"
      ) {
        throw new Error("Invalid authoring construct.");
      }

      return openAuthoringConstruct(construct);
    },
  );

  registerIpcHandler("workbench:set-authoring-mode", (event, mode: unknown) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    if (mode !== "rich" && mode !== "source") {
      throw new Error("Invalid authoring representation.");
    }

    return setAuthoringMode(mode);
  });

  registerIpcHandler("workbench:read-proposal-review", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return readProposalReview();
  });

  registerIpcHandler(
    "workbench:read-atlas-orientation",
    (event): Promise<AtlasOrientationReadOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      return atlasOrientation.read();
    },
  );

  registerIpcHandler(
    "workbench:edit-learning-route-title",
    (
      event,
      routeId: unknown,
      title: unknown,
    ): Promise<AtlasLearningRouteEditOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (
        typeof routeId !== "string" ||
        routeId.length === 0 ||
        typeof title !== "string"
      ) {
        throw new Error("Invalid Learning Route edit.");
      }

      return atlasOrientation.editLearningRouteTitle(routeId, title);
    },
  );

  registerIpcHandler(
    "workbench:read-learning-progress",
    (event): Promise<LearningReadOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      return learning.suggest();
    },
  );

  registerIpcHandler(
    "workbench:confirm-learning-progress",
    (event, suggestionId: unknown): Promise<LearningOperationOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (typeof suggestionId !== "string" || suggestionId.length === 0) {
        throw new Error("Invalid learning progress confirmation.");
      }

      return learning.confirm(suggestionId);
    },
  );

  registerIpcHandler(
    "workbench:correct-learning-progress",
    (
      event,
      suggestionId: unknown,
      correction: unknown,
    ): Promise<LearningOperationOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (
        typeof suggestionId !== "string" ||
        suggestionId.length === 0 ||
        typeof correction !== "string"
      ) {
        throw new Error("Invalid learning progress correction.");
      }

      return learning.correct(suggestionId, correction);
    },
  );

  registerIpcHandler("workbench:open-proposal-review", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return readProposalReview();
  });

  registerIpcHandler(
    "workbench:accept-proposal-review",
    (event): Promise<ProposalReviewApplyOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      return acceptProposalReview();
    },
  );

  registerIpcHandler("workbench:create-repository", async (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    let repositoryPath = pendingCreateRepositoryPath;
    if (repositoryPath === undefined) {
      const selection = await dialog.showOpenDialog(mainWindow, {
        buttonLabel: "Create Repository",
        message: "Choose where to create the Knowledge Repository.",
        properties: ["openDirectory", "createDirectory"],
      });

      if (selection.canceled || selection.filePaths[0] === undefined) {
        return { outcome: "canceled" as const };
      }

      repositoryPath = selection.filePaths[0];
    }

    try {
      pendingCreateRepositoryPath = repositoryPath;
      maybeInjectFailure("repository-create");
      const outcome = await workbenchSession.createRepository(repositoryPath);
      pendingCreateRepositoryPath = undefined;
      return outcome;
    } catch (cause: unknown) {
      pendingCreateRepositoryPath = repositoryPath;
      throw cause;
    }
  });

  registerIpcHandler("workbench:open-repository", async (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    let repositoryPath = pendingOpenRepositoryPath;
    if (repositoryPath === undefined) {
      const selection = await dialog.showOpenDialog(mainWindow, {
        buttonLabel: "Open Repository",
        message: "Choose a Knowledge Repository to open.",
        properties: ["openDirectory"],
      });

      if (selection.canceled || selection.filePaths[0] === undefined) {
        return { outcome: "canceled" as const };
      }

      repositoryPath = selection.filePaths[0];
    }

    try {
      pendingOpenRepositoryPath = repositoryPath;
      maybeInjectFailure("repository-open");
      const outcome = await workbenchSession.openRepository(repositoryPath);
      pendingOpenRepositoryPath = undefined;
      return outcome;
    } catch (cause: unknown) {
      pendingOpenRepositoryPath = repositoryPath;
      throw cause;
    }
  });

  registerIpcHandler(
    "workbench:select-context",
    (event, selection: unknown) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (
        typeof selection !== "object" ||
        selection === null ||
        !("topicId" in selection) ||
        !("sourceRecordId" in selection) ||
        typeof selection.topicId !== "string" ||
        selection.topicId.length === 0 ||
        typeof selection.sourceRecordId !== "string" ||
        selection.sourceRecordId.length === 0
      ) {
        throw new Error("Invalid Workbench context selection.");
      }

      maybeInjectFailure("context-selection");
      return workbenchSession.selectWorkbenchContext({
        topicId: selection.topicId,
        sourceRecordId: selection.sourceRecordId,
      });
    },
  );

  registerIpcHandler(
    "workbench:open-topic-in-studio",
    (event, topicId: unknown) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (typeof topicId !== "string" || topicId.length === 0) {
        throw new Error("Invalid Workbench topic transition.");
      }

      maybeInjectFailure("workspace-transition");
      return workbenchSession.openTopicInStudio(topicId);
    },
  );

  registerIpcHandler(
    "workbench:open-source-record-in-paper-desk",
    (event, sourceRecordId: unknown) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (typeof sourceRecordId !== "string" || sourceRecordId.length === 0) {
        throw new Error("Invalid Workbench Source Record transition.");
      }

      maybeInjectFailure("source-navigation");
      return workbenchSession.openSourceRecordInPaperDesk(sourceRecordId);
    },
  );

  registerIpcHandler(
    "workbench:switch-workspace",
    (event, workspace: unknown) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }

      if (!isWorkbenchWorkspace(workspace)) {
        throw new Error("Invalid Workbench workspace transition.");
      }

      maybeInjectFailure("discovery-jump-transition");
      maybeInjectFailure("workspace-transition");
      return workbenchSession.switchWorkspace(workspace);
    },
  );

  registerIpcHandler("workbench:open-saved-annotation", (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return workbenchSession.openSavedAnnotation();
  });

  registerIpcHandler(
    "workbench:discovery-search",
    async (event, query: unknown): Promise<DiscoverySearchOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }
      if (typeof query !== "string") {
        return {
          outcome: "invalid-query",
          detail: "Enter a Search term.",
        };
      }
      return (await discoveryFor()).search(query);
    },
  );

  registerIpcHandler(
    "workbench:discovery-context-candidates",
    async (event) => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }
      return (await discoveryFor()).readAskContextCandidates();
    },
  );

  registerIpcHandler(
    "workbench:prepare-ask",
    async (event, request: unknown): Promise<PrepareAskOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }
      if (
        typeof request !== "object" ||
        request === null ||
        !("prompt" in request) ||
        !("contextItemIds" in request) ||
        typeof request.prompt !== "string" ||
        !Array.isArray(request.contextItemIds) ||
        !request.contextItemIds.every((id) => typeof id === "string")
      ) {
        return {
          outcome: "invalid-prompt",
          detail: "Enter a question before preparing an Ask request.",
        };
      }

      const outcome = await (
        await discoveryFor()
      ).prepareAsk({
        prompt: request.prompt,
        contextItemIds: request.contextItemIds,
      });
      if (outcome.outcome === "preview-ready") {
        const workbench = await workbenchSession.openFreshWorkbench();
        pendingAsk = {
          repositoryPath: workbench.repositoryPath ?? "",
          preview: outcome.preview,
        };
      } else {
        pendingAsk = undefined;
      }
      return outcome;
    },
  );

  registerIpcHandler(
    "workbench:remove-ask-context-item",
    async (event, itemId: unknown): Promise<PrepareAskOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }
      if (typeof itemId !== "string" || itemId.length === 0) {
        return {
          outcome: "unsupported",
          detail: "The Ask context item is not available.",
        };
      }
      if (pendingAsk === undefined) {
        return {
          outcome: "unsupported",
          detail: "Prepare the Ask request again before editing it.",
        };
      }

      const outcome = await (
        await discoveryFor()
      ).removeAskContextItem({
        preview: pendingAsk.preview,
        itemId,
      });
      if (outcome.outcome === "preview-ready") {
        pendingAsk = { ...pendingAsk, preview: outcome.preview };
      }
      return outcome;
    },
  );

  registerIpcHandler(
    "workbench:confirm-ask",
    async (event, confirmation: unknown): Promise<ConfirmAskOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }
      if (
        confirmation !== "confirmed" &&
        confirmation !== "declined" &&
        confirmation !== "canceled"
      ) {
        throw new Error("Invalid Ask confirmation.");
      }
      if (pendingAsk === undefined) {
        return {
          outcome: "operation-failed",
          detail: "The Ask preview is no longer available. Prepare it again.",
        };
      }

      const workbench = await workbenchSession.openFreshWorkbench();
      if (
        workbench.repositoryPath === undefined ||
        workbench.repositoryPath !== pendingAsk.repositoryPath
      ) {
        pendingAsk = undefined;
        return {
          outcome: "operation-failed",
          detail: "The Ask preview is no longer available. Prepare it again.",
        };
      }

      const preview = pendingAsk.preview;
      pendingAsk = undefined;
      return (await discoveryFor()).confirmAsk({ preview, confirmation });
    },
  );

  registerIpcHandler(
    "workbench:discovery-jump",
    async (event, command: unknown): Promise<DiscoveryJumpOutcome> => {
      if (event.sender !== mainWindow.webContents) {
        throw new Error("Untrusted Workbench bridge sender.");
      }
      if (typeof command !== "string") {
        return {
          outcome: "invalid-command",
          detail: "Enter a known Workbench destination or command.",
        };
      }
      return (await discoveryFor()).jump(command);
    },
  );

  registerIpcHandler(
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

  registerIpcHandler(
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

  registerIpcHandler(
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

  registerIpcHandler("workbench:read-synthesis-results", async (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Untrusted Workbench bridge sender.");
    }

    return readSynthesisResults();
  });

  registerIpcHandler(
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

      maybeInjectFailure("synthesis-result-restore");

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
    removeWorkbenchIpcHandlers();
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

// Window startup recovery keeps the application usable when loading fails and
// never exposes the underlying exception through the native dialog.
const recoverWindowStartup = async (): Promise<void> => {
  recordMainDiagnostic("create-window", "window", "startup-failure");
  const result = await dialog.showMessageBox({
    type: "error",
    title: "Galaxy Brain couldn't start",
    message: "Galaxy Brain couldn't start",
    detail:
      "The Workbench could not finish loading. Retry the application or quit safely.",
    buttons: ["Retry", "Quit"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (result.response === 0) {
    // A failed load may have registered handlers on a still-open window;
    // destroy it first so the retry can recreate the one-window composition.
    removeWorkbenchIpcHandlers();
    BrowserWindow.getAllWindows().forEach((window) => window.destroy());
    await createWindow().catch(() => recoverWindowStartup());
    return;
  }

  app.quit();
};

const startWindow = async (): Promise<void> => {
  await createWindow().catch(() => recoverWindowStartup());
};

// Wait for Electron's lifecycle before creating windows or registering window
// content that depends on the ready application state.
app.whenReady().then(() => void startWindow());

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
    void startWindow();
  }
});
