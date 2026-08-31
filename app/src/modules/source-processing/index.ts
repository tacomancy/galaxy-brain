/** A durable logical location within a Source Record. Character ranges use an exclusive end. */
export interface SourceLocator {
  page: number;
  start: number;
  end: number;
  logical: string;
}

/** Stable identity and human-readable title for a portable Source Record. */
export interface SourceRecordReference {
  id: string;
  title: string;
}

/** Working Material bound to a source location and classified as a source claim. */
export interface StructuredAnnotation {
  id: string;
  state: "working-material";
  sourceRecord: SourceRecordReference;
  sourceLocator: SourceLocator;
  text: string;
  attribution: "source-claim";
  classification: "source-claim";
}

/** Stable topic identity used as the target of an explicit Synthesis request. */
export interface SynthesisTopicReference {
  id: string;
  title: string;
}

/** Provider details shown before an Agentic Capability can transmit. */
export interface SynthesisProviderReference {
  destination: string;
  model: string;
}

/** Selected evidence and target context for a Synthesis preview. */
export interface PrepareSynthesisInput {
  targetTopic: SynthesisTopicReference;
  selectedAnnotations: StructuredAnnotation[];
  provider: SynthesisProviderReference;
  prompt?: string;
}

/** One source-bound item in the inspectable Synthesis payload. */
export interface SynthesisContextItem {
  kind: "structured-annotation";
  annotationId: string;
  text: string;
  sourceRecord: SourceRecordReference;
  sourceLocator: string;
  attribution: StructuredAnnotation["attribution"];
  classification: StructuredAnnotation["classification"];
  state: StructuredAnnotation["state"];
}

/** Exact request data shown before the Model Adapter is called. */
export interface SynthesisPayload {
  operation: "synthesize-into-topic";
  model: string;
  targetTopic: SynthesisTopicReference;
  context: SynthesisContextItem[];
  prompt?: string;
}

/** Fixed result shape returned by the operation-specific Model Adapter. */
export interface SynthesisDraft {
  title: string;
  text: string;
}

/** External Model Adapter outcome for confirmed Synthesis. */
export type SynthesisModelOutcome =
  | { outcome: "draft-proposal"; draft: SynthesisDraft }
  | { outcome: "agent-provider-unavailable"; detail: string };

/** Narrow external seam for the confirmed Synthesis request. */
export interface SynthesisModelAdapter {
  requestSynthesis(payload: SynthesisPayload): Promise<SynthesisModelOutcome>;
}

/** Provenance references retained by an explicitly saved agent result. */
export interface SynthesisSourceContextReference {
  annotationId: string;
  sourceRecord: SourceRecordReference;
  sourceLocator: string;
  attribution: StructuredAnnotation["attribution"];
  classification: StructuredAnnotation["classification"];
}

/** Current comparable identity for a Source Record and its content. */
export type SynthesisSourceIdentityOutcome =
  | {
      outcome: "available";
      sourceIdentity: string;
      contentIdentity: string;
    }
  | { outcome: "unavailable"; detail: string };

/** External seam for checking a saved Synthesis context against its source. */
export interface SynthesisSourceIdentityAdapter {
  readIdentity(sourceRecordId: string): Promise<SynthesisSourceIdentityOutcome>;
}

/** Current identity outcome for a linked Source Asset; unavailable is explicit. */
export interface SourceAssetIdentity {
  sourceIdentity: string;
  contentIdentity: string;
}

/** Result of reading the recorded and current identity for a linked asset. */
export type SourceAssetIdentityOutcome =
  | {
      outcome: "available";
      /** Identity recorded for the current machine-local link. */
      recorded: SourceAssetIdentity;
      /** Identity read from the bytes currently at that link. */
      current: SourceAssetIdentity;
    }
  | { outcome: "unavailable"; detail: string };

/** Outcome of verifying a replacement before committing its machine-local link. */
export type SourceAssetRelinkOutcome =
  | SourceAssetIdentityOutcome
  | {
      outcome: "changed";
      recorded: SourceAssetIdentity;
      current: SourceAssetIdentity;
    };

/**
 * External seam for linked Source Asset identity and explicit replacement.
 * The Adapter owns machine-local path, hash, and locator verification; Source
 * Processing owns caller-visible status and preservation policy.
 */
export interface SourceAssetAdapter {
  /** Returns unavailable rather than throwing when identity cannot be read. */
  readIdentity(sourceRecordId: string): Promise<SourceAssetIdentityOutcome>;
  /**
   * Returns unavailable or changed without committing when verification fails;
   * commits only after identity and locator verification succeeds.
   */
  relink(input: RelinkSourceInput): Promise<SourceAssetRelinkOutcome>;
}

/** Agent provenance retained without promoting the result to authority. */
export interface SynthesisProvenance {
  attribution: "agent-generated";
  provider: string;
  model: string;
  generatedAt: string;
  operation: "synthesize-into-topic";
  sourceContext: SynthesisSourceContextReference[];
}

/** Explicitly saved Synthesis result, still held as Working Material. */
export interface SynthesisSavedResult {
  id: string;
  state: "working-material";
  title: string;
  text: string;
  targetTopic: SynthesisTopicReference;
  provenance: SynthesisProvenance;
  prompt?: string;
  contextSnapshot?: SynthesisContextSnapshot[];
  contextSnapshotVersion?: number;
  contextSnapshotRefreshedAt?: string;
  priorContextSnapshots?: SynthesisContextSnapshotVersion[];
  resultVersion?: number;
  priorResults?: SynthesisSavedResult[];
  humanAuthorship?: "human-authored";
  humanEdits?: SynthesisHumanEdit[];
}

/** Concise, point-in-time context retained only with explicit opt-in. */
export interface SynthesisContextSnapshot {
  annotationId: string;
  sourceRecord: SourceRecordReference;
  sourceLocator: string;
  sourceIdentity: string;
  contentIdentity: string;
  summary: string;
}

/** Prior point-in-time context retained when an explicit refresh is saved. */
export interface SynthesisContextSnapshotVersion {
  version: number;
  refreshedAt: string;
  snapshot: SynthesisContextSnapshot[];
}

/** Human-authorship record retained alongside the original agent provenance. */
export interface SynthesisHumanEdit {
  attribution: "human-authored";
  editedAt: string;
  changedFields: ("title" | "text")[];
}

/** Repository Adapter for explicit Synthesis result persistence. */
export interface SynthesisResultRepository {
  saveResult(result: SynthesisSavedResult): Promise<void>;
  readResult?(resultId: string): Promise<SynthesisResultReadOutcome>;
  readResults?(): Promise<SynthesisResultListReadOutcome>;
}

/** Caller-visible read outcome for one explicitly saved Synthesis result. */
export type SynthesisResultReadOutcome =
  | { outcome: "found"; result: SynthesisSavedResult }
  | { outcome: "not-found"; detail: string }
  | { outcome: "unavailable"; detail: string };

/** Caller-visible read outcome for the saved Synthesis result collection. */
export type SynthesisResultListReadOutcome =
  | { outcome: "found"; results: SynthesisSavedResult[] }
  | { outcome: "unavailable"; detail: string };

/** Concise and exact views of one pending Synthesis operation. */
export interface SynthesisPreview {
  summary: string;
  estimatedRequestSize: number;
  provider: SynthesisProviderReference;
  payload: SynthesisPayload;
  prompt?: string;
}

/** Input for removing one complete context item before confirmation. */
export interface RemoveSynthesisContextItemInput {
  preview: SynthesisPreview;
  annotationId: string;
}

/** User decision applied immediately before an external Synthesis request. */
export interface ConfirmSynthesisInput {
  preview: SynthesisPreview;
  confirmation: "confirmed" | "declined" | "canceled";
}

/** Explicit save request for a transient confirmed Synthesis result. */
export interface SaveSynthesisResultInput {
  resultId: string;
  preview: SynthesisPreview;
  draft: SynthesisDraft;
  generatedAt: string;
  includePromptAndContext?: boolean;
}

/** Input for checking saved source context against current source identity. */
export interface CheckSynthesisContextInput {
  result: SynthesisSavedResult;
}

/** Explicit request to refresh source identities without regenerating text. */
export interface RefreshSynthesisContextInput {
  result: SynthesisSavedResult;
  refreshedAt: string;
}

/** Explicit request to regenerate a saved result after a fresh confirmation. */
export interface RegenerateSynthesisResultInput {
  previousResult: SynthesisSavedResult;
  preview: SynthesisPreview;
  confirmation: ConfirmSynthesisInput["confirmation"];
  generatedAt: string;
}

/** Explicit request to restore an older saved result as the current version. */
export interface RestoreSynthesisResultInput {
  currentResult: SynthesisSavedResult;
  version: number;
}

/** Explicit request to edit a saved Synthesis result as Working Material. */
export interface EditSynthesisResultInput {
  result: SynthesisSavedResult;
  title: string;
  text: string;
  editedAt: string;
}

/** Caller-visible result of an explicit Synthesis save. */
export type SaveSynthesisResultOutcome =
  | { outcome: "saved"; result: SynthesisSavedResult }
  | { outcome: "operation-failed"; detail: string };

/** Caller-visible source freshness outcome for a saved Synthesis result. */
export type CheckSynthesisContextOutcome =
  | { outcome: "current"; result: SynthesisSavedResult }
  | {
      outcome: "stale-context";
      result: SynthesisSavedResult;
      warning: string;
    }
  | {
      outcome: "source-status-unavailable";
      result: SynthesisSavedResult;
      warning: string;
    }
  | { outcome: "operation-failed"; detail: string };

/** Caller-visible outcome of an explicit Synthesis context refresh. */
export type RefreshSynthesisContextOutcome =
  | { outcome: "refreshed"; result: SynthesisSavedResult }
  | { outcome: "operation-failed"; detail: string };

/** Caller-visible outcome of an explicit Synthesis result regeneration. */
export type RegenerateSynthesisResultOutcome =
  | { outcome: "regenerated"; result: SynthesisSavedResult }
  | { outcome: "declined" }
  | { outcome: "canceled" }
  | { outcome: "agent-provider-unavailable"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/** Caller-visible outcome of an explicit Synthesis result restore. */
export type RestoreSynthesisResultOutcome =
  | { outcome: "restored"; result: SynthesisSavedResult }
  | { outcome: "operation-failed"; detail: string };

/** Caller-visible outcome of an explicit human edit. */
export type EditSynthesisResultOutcome =
  | { outcome: "edited"; result: SynthesisSavedResult }
  | { outcome: "operation-failed"; detail: string };

/** Caller-visible outcome after the confirmation boundary. */
export type ConfirmSynthesisOutcome =
  | SynthesisModelOutcome
  | { outcome: "declined" }
  | { outcome: "canceled" }
  | { outcome: "operation-failed"; detail: string };

/** Caller-visible outcome of preparing a Synthesis preview. */
export type PrepareSynthesisOutcome =
  | { outcome: "preview-ready"; preview: SynthesisPreview }
  | { outcome: "invalid-selection"; detail: string };

/** Caller-selected source location for the first TB5 capture behavior. */
export interface CaptureSourceClaimInput {
  sourceRecord: SourceRecordReference;
  page: number;
  start: number;
  end: number;
  /**
   * Optional caller-observed identity. When a Source Asset Adapter is
   * composed, capture still compares the Adapter's recorded and current
   * identities, so omitting these fields cannot bypass the changed-source
   * guard.
   */
  expectedSourceIdentity?: string;
  expectedContentIdentity?: string;
}

/** Input for checking a linked Source Asset against its recorded identities. */
export interface CheckSourceAvailabilityInput {
  sourceRecord: SourceRecordReference;
  /** Optional expected recorded identity; the Adapter is authoritative when omitted. */
  expectedSourceIdentity?: string;
  expectedContentIdentity?: string;
}

/** Caller-visible result of checking one linked Source Asset. */
export type CheckSourceAvailabilityOutcome =
  | {
      outcome: "available";
      sourceRecord: SourceRecordReference;
      sourceIdentity: string;
      contentIdentity: string;
    }
  | {
      outcome: "source-status-unavailable";
      sourceRecord: SourceRecordReference;
      warning: "source status unavailable";
      detail: string;
    }
  | {
      outcome: "source-changed";
      sourceRecord: SourceRecordReference;
      warning: "source status changed";
      expectedSourceIdentity: string;
      expectedContentIdentity: string;
      actualSourceIdentity: string;
      actualContentIdentity: string;
    };

/**
 * Input for a caller-authorized replacement. The Adapter must verify the
 * expected replacement identities and locator before committing its link.
 */
export interface RelinkSourceInput {
  sourceRecord: SourceRecordReference;
  /** Machine-local replacement reference; never portable repository content. */
  replacementReference: string;
  /** Identity values the replacement must produce before it is committed. */
  expectedReplacementSourceIdentity: string;
  expectedReplacementContentIdentity: string;
  /** Known page/range that the replacement must resolve. */
  verificationLocator: Pick<CaptureSourceClaimInput, "page" | "start" | "end">;
}

/** Caller-visible result of an explicit linked Source Asset replacement. */
export type RelinkSourceOutcome =
  | {
      outcome: "relinked";
      sourceRecord: SourceRecordReference;
      sourceIdentity: string;
      contentIdentity: string;
    }
  | {
      outcome: "source-changed";
      sourceRecord: SourceRecordReference;
      warning: "source status changed";
      expectedSourceIdentity: string;
      expectedContentIdentity: string;
      actualSourceIdentity: string;
      actualContentIdentity: string;
    }
  | {
      outcome: "source-status-unavailable";
      sourceRecord: SourceRecordReference;
      warning: "source status unavailable";
      detail: string;
    };

/** Result of resolving a caller-selected range through a PDF Adapter. */
export type PdfSelectionOutcome =
  | { outcome: "located"; text: string }
  | { outcome: "source-unavailable"; detail: string };

/** Adapter seam for source material; it does not own capture classification. */
export interface PdfAdapter {
  /** Resolves the requested source range or reports that it is unavailable. */
  readSelection(input: CaptureSourceClaimInput): Promise<PdfSelectionOutcome>;
}

/** Caller-facing read result for persisted Working Material. */
export type WorkingMaterialReadOutcome =
  | { outcome: "found"; annotation: StructuredAnnotation }
  | { outcome: "not-found"; detail: string }
  | { outcome: "unavailable"; detail: string };

/** Caller-visible read outcome for all annotations bound to one Source Record. */
export type WorkingMaterialListReadOutcome =
  | { outcome: "found"; annotations: StructuredAnnotation[] }
  | { outcome: "not-found"; detail: string }
  | { outcome: "unavailable"; detail: string };

/** Adapter seam for durable or locally substitutable Working Material. */
export interface WorkingMaterialRepository {
  /** Persists one source annotation as Working Material. */
  saveAnnotation(annotation: StructuredAnnotation): Promise<void>;
  /** Reopens an annotation or returns a caller-meaningful read outcome. */
  readAnnotation(annotationId: string): Promise<WorkingMaterialReadOutcome>;
  /**
   * Finds the lexicographically first saved annotation associated with one
   * Source Record when several annotations match.
   */
  readAnnotationForSourceRecord(
    sourceRecordId: string,
  ): Promise<WorkingMaterialReadOutcome>;
  /** Finds all saved annotations associated with one Source Record in ID order. */
  readAnnotationsForSourceRecord?(
    sourceRecordId: string,
  ): Promise<WorkingMaterialListReadOutcome>;
}

/** Caller-visible result of the first source-claim capture behavior. */
export type CaptureSourceClaimOutcome =
  | { outcome: "captured"; annotation: StructuredAnnotation }
  | { outcome: "source-unavailable"; detail: string }
  | { outcome: "invalid-locator"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/** Public Source Processing behavior used by S3 callers and tests. */
export interface SourceProcessing {
  /**
   * Captures a located source claim without creating Synthesis or a Proposal.
   * With a Source Asset Adapter, optional caller-observed identities are
   * checked against the Adapter's recorded and current identities, and a
   * changed or unavailable source is refused before PDF resolution.
   */
  captureSourceClaim(
    input: CaptureSourceClaimInput,
  ): Promise<CaptureSourceClaimOutcome>;
  /**
   * Checks linked identity without changing portable source data. Returns
   * available, source-status-unavailable, or source-changed; Adapters
   * translate infrastructure failures into the unavailable outcome.
   */
  checkSourceAvailability(
    input: CheckSourceAvailabilityInput,
  ): Promise<CheckSourceAvailabilityOutcome>;
  /**
   * Explicitly verifies and accepts a replacement linked Source Asset.
   * Returns relinked, source-changed, or source-status-unavailable.
   */
  relinkSource(input: RelinkSourceInput): Promise<RelinkSourceOutcome>;
  /** Prepares an inspectable Synthesis request without contacting a provider. */
  prepareSynthesis(
    input: PrepareSynthesisInput,
  ): Promise<PrepareSynthesisOutcome>;
  /** Removes one selected annotation and regenerates both preview views. */
  removeSynthesisContextItem(
    input: RemoveSynthesisContextItemInput,
  ): Promise<PrepareSynthesisOutcome>;
  /** Sends the final preview only after explicit confirmation. */
  confirmSynthesis(
    input: ConfirmSynthesisInput,
  ): Promise<ConfirmSynthesisOutcome>;
  /** Explicitly persists a confirmed result as attributed Working Material. */
  saveSynthesisResult(
    input: SaveSynthesisResultInput,
  ): Promise<SaveSynthesisResultOutcome>;
  /** Checks saved context without rewriting or blocking the result. */
  checkSynthesisContext(
    input: CheckSynthesisContextInput,
  ): Promise<CheckSynthesisContextOutcome>;
  /** Refreshes saved source identities while preserving the generated result. */
  refreshSynthesisContext(
    input: RefreshSynthesisContextInput,
  ): Promise<RefreshSynthesisContextOutcome>;
  /** Regenerates and saves a new result version only after fresh confirmation. */
  regenerateSynthesisResult(
    input: RegenerateSynthesisResultInput,
  ): Promise<RegenerateSynthesisResultOutcome>;
  /** Restores an older result as a new current version without provider calls. */
  restoreSynthesisResult(
    input: RestoreSynthesisResultInput,
  ): Promise<RestoreSynthesisResultOutcome>;
  /** Records human authorship without removing agent provenance. */
  editSynthesisResult(
    input: EditSynthesisResultInput,
  ): Promise<EditSynthesisResultOutcome>;
}

/** Concrete Adapters composed around the Source Processing policy. */
export interface SourceProcessingDependencies {
  pdf: PdfAdapter;
  workingMaterial: WorkingMaterialRepository;
  model?: SynthesisModelAdapter;
  results?: SynthesisResultRepository;
  sourceIdentity?: SynthesisSourceIdentityAdapter;
  /** Optional for legacy provider-free capture; required for linked checks. */
  sourceAsset?: SourceAssetAdapter;
  diagnostics?: SourceProcessingDiagnostics;
}

/** Internal diagnostic sink; causes stay outside caller-visible outcomes. */
export interface SourceProcessingDiagnostics {
  record(cause: unknown): void;
}

type SourceStatusUnavailableOutcome = Extract<
  CheckSourceAvailabilityOutcome,
  { outcome: "source-status-unavailable" }
>;

const sourceStatusUnavailable = (
  sourceRecord: SourceRecordReference,
  detail: string,
): SourceStatusUnavailableOutcome => ({
  outcome: "source-status-unavailable",
  sourceRecord: { ...sourceRecord },
  warning: "source status unavailable",
  detail,
});

type SourceChangedOutcome = Extract<
  CheckSourceAvailabilityOutcome,
  { outcome: "source-changed" }
>;

const sourceChanged = (
  sourceRecord: SourceRecordReference,
  expectedSourceIdentity: string,
  expectedContentIdentity: string,
  actualSourceIdentity: string,
  actualContentIdentity: string,
): SourceChangedOutcome => ({
  outcome: "source-changed",
  sourceRecord: { ...sourceRecord },
  warning: "source status changed",
  expectedSourceIdentity,
  expectedContentIdentity,
  actualSourceIdentity,
  actualContentIdentity,
});

const isValidLocator = (input: CaptureSourceClaimInput): boolean =>
  Number.isInteger(input.page) &&
  input.page > 0 &&
  Number.isInteger(input.start) &&
  input.start >= 0 &&
  Number.isInteger(input.end) &&
  input.end > input.start;

const annotationIdFor = (input: CaptureSourceClaimInput): string =>
  `annotation-${input.sourceRecord.id}-page-${input.page}-${input.start}-${input.end}`;

const logicalLocatorFor = (input: CaptureSourceClaimInput): string =>
  `page:${input.page}#chars=${input.start}-${input.end}`;

const buildSynthesisPreview = (
  targetTopic: SynthesisTopicReference,
  provider: SynthesisProviderReference,
  context: SynthesisContextItem[],
  prompt?: string,
): PrepareSynthesisOutcome => {
  if (
    (context.length === 0 && (prompt === undefined || prompt.length === 0)) ||
    targetTopic.id.length === 0 ||
    targetTopic.title.length === 0 ||
    provider.destination.length === 0 ||
    provider.model.length === 0
  ) {
    return {
      outcome: "invalid-selection",
      detail: "Synthesis requires a target topic and selected evidence.",
    };
  }

  const estimatedRequestSize = context.reduce(
    (size, item) => size + item.text.length,
    0,
  );
  const contextSummary =
    context.length === 0
      ? "with no repository-derived context"
      : `${context.length} selected ${context.length === 1 ? "source claim" : "source claims"}`;
  const promptSummary = prompt === undefined ? "" : ` Prompt: "${prompt}".`;
  const payload: SynthesisPayload = {
    operation: "synthesize-into-topic",
    model: provider.model,
    targetTopic: { ...targetTopic },
    context: context.map((item) => ({
      ...item,
      sourceRecord: { ...item.sourceRecord },
    })),
    ...(prompt === undefined ? {} : { prompt }),
  };

  return {
    outcome: "preview-ready",
    preview: {
      summary: `Synthesize ${contextSummary} into "${targetTopic.title}" using model "${provider.model}" via ${provider.destination}; ${estimatedRequestSize} source characters selected.${promptSummary}`,
      estimatedRequestSize,
      provider: { ...provider },
      ...(prompt === undefined ? {} : { prompt }),
      payload,
    },
  };
};

type SynthesisContextIdentities = Map<
  string,
  { sourceIdentity: string; contentIdentity: string }
>;

const buildSavedSynthesisResult = (
  input: SaveSynthesisResultInput,
  contextIdentities: SynthesisContextIdentities,
): SynthesisSavedResult => ({
  id: input.resultId,
  state: "working-material",
  title: input.draft.title,
  text: input.draft.text,
  targetTopic: { ...input.preview.payload.targetTopic },
  provenance: {
    attribution: "agent-generated",
    provider: input.preview.provider.destination,
    model: input.preview.provider.model,
    generatedAt: input.generatedAt,
    operation: input.preview.payload.operation,
    sourceContext: input.preview.payload.context.map((item) => ({
      annotationId: item.annotationId,
      sourceRecord: { ...item.sourceRecord },
      sourceLocator: item.sourceLocator,
      attribution: item.attribution,
      classification: item.classification,
    })),
  },
  ...(input.includePromptAndContext
    ? {
        ...(input.preview.prompt === undefined
          ? {}
          : { prompt: input.preview.prompt }),
        contextSnapshot: input.preview.payload.context.map((item) => ({
          // Every context item was checked and inserted by the caller.
          ...contextIdentities.get(item.annotationId)!,
          annotationId: item.annotationId,
          sourceRecord: { ...item.sourceRecord },
          sourceLocator: item.sourceLocator,
          summary: `Selected ${item.classification === "source-claim" ? "source claim" : item.classification} from the ${item.sourceRecord.title}.`,
        })),
        contextSnapshotVersion: 1,
        contextSnapshotRefreshedAt: input.generatedAt,
      }
    : {}),
});

/**
 * Composes capture policy behind the Source Processing Interface. The PDF
 * Adapter resolves source material; this Module owns attribution, locator
 * representation, and the Working Material state. The Source Asset Adapter
 * verifies machine-local linked assets and commits explicit relinks only
 * after its requested identity and locator checks succeed.
 * @param dependencies The PDF, Source Asset, Working Material, and model Adapters.
 * @returns The Source Processing Module Interface.
 */
export const createSourceProcessing = (
  dependencies: SourceProcessingDependencies,
): SourceProcessing => {
  const checkSourceAvailability = async (
    input: CheckSourceAvailabilityInput,
  ): Promise<CheckSourceAvailabilityOutcome> => {
    const sourceRecord = { ...input.sourceRecord };

    if (dependencies.sourceAsset === undefined) {
      return sourceStatusUnavailable(
        sourceRecord,
        "The linked source asset could not be checked.",
      );
    }

    const identity = await dependencies.sourceAsset.readIdentity(
      input.sourceRecord.id,
    );

    if (identity.outcome === "unavailable") {
      return sourceStatusUnavailable(sourceRecord, identity.detail);
    }

    const expectedSourceIdentity =
      input.expectedSourceIdentity ?? identity.recorded.sourceIdentity;
    const expectedContentIdentity =
      input.expectedContentIdentity ?? identity.recorded.contentIdentity;

    if (
      identity.recorded.sourceIdentity !== expectedSourceIdentity ||
      identity.recorded.contentIdentity !== expectedContentIdentity ||
      identity.current.sourceIdentity !== expectedSourceIdentity ||
      identity.current.contentIdentity !== expectedContentIdentity
    ) {
      return sourceChanged(
        sourceRecord,
        expectedSourceIdentity,
        expectedContentIdentity,
        identity.current.sourceIdentity,
        identity.current.contentIdentity,
      );
    }

    return {
      outcome: "available",
      sourceRecord,
      sourceIdentity: identity.current.sourceIdentity,
      contentIdentity: identity.current.contentIdentity,
    };
  };

  const relinkSource = async (
    input: RelinkSourceInput,
  ): Promise<RelinkSourceOutcome> => {
    const sourceRecord = { ...input.sourceRecord };

    if (dependencies.sourceAsset === undefined) {
      return sourceStatusUnavailable(
        sourceRecord,
        "The linked source asset could not be relinked.",
      );
    }

    const identity = await dependencies.sourceAsset.relink(input);

    if (identity.outcome === "unavailable") {
      return sourceStatusUnavailable(sourceRecord, identity.detail);
    }

    if (identity.outcome === "changed") {
      return sourceChanged(
        sourceRecord,
        input.expectedReplacementSourceIdentity,
        input.expectedReplacementContentIdentity,
        identity.current.sourceIdentity,
        identity.current.contentIdentity,
      );
    }

    if (
      identity.recorded.sourceIdentity !==
        input.expectedReplacementSourceIdentity ||
      identity.recorded.contentIdentity !==
        input.expectedReplacementContentIdentity ||
      identity.current.sourceIdentity !==
        input.expectedReplacementSourceIdentity ||
      identity.current.contentIdentity !==
        input.expectedReplacementContentIdentity
    ) {
      return sourceChanged(
        sourceRecord,
        input.expectedReplacementSourceIdentity,
        input.expectedReplacementContentIdentity,
        identity.current.sourceIdentity,
        identity.current.contentIdentity,
      );
    }

    return {
      outcome: "relinked",
      sourceRecord,
      sourceIdentity: identity.current.sourceIdentity,
      contentIdentity: identity.current.contentIdentity,
    };
  };

  const captureSourceClaim = async (
    input: CaptureSourceClaimInput,
  ): Promise<CaptureSourceClaimOutcome> => {
    if (!isValidLocator(input)) {
      return {
        outcome: "invalid-locator",
        detail: "The source locator is invalid.",
      };
    }

    if (dependencies.sourceAsset !== undefined) {
      const availability = await checkSourceAvailability({
        sourceRecord: input.sourceRecord,
        ...(input.expectedSourceIdentity === undefined
          ? {}
          : { expectedSourceIdentity: input.expectedSourceIdentity }),
        ...(input.expectedContentIdentity === undefined
          ? {}
          : { expectedContentIdentity: input.expectedContentIdentity }),
      });

      if (availability.outcome !== "available") {
        return {
          outcome: "source-unavailable",
          detail:
            availability.outcome === "source-changed"
              ? "The source status changed; relink is required before capture."
              : availability.detail,
        };
      }
    }

    let sourceSelection: PdfSelectionOutcome;

    try {
      sourceSelection = await dependencies.pdf.readSelection(input);
    } catch (cause: unknown) {
      dependencies.diagnostics?.record(cause);
      return {
        outcome: "operation-failed",
        detail: "The source passage could not be resolved.",
      };
    }

    if (sourceSelection.outcome === "source-unavailable") {
      return sourceSelection;
    }

    if (sourceSelection.text.length !== input.end - input.start) {
      return {
        outcome: "invalid-locator",
        detail: "The resolved source passage does not match its locator.",
      };
    }

    const annotation: StructuredAnnotation = {
      id: annotationIdFor(input),
      state: "working-material",
      sourceRecord: { ...input.sourceRecord },
      sourceLocator: {
        page: input.page,
        start: input.start,
        end: input.end,
        logical: logicalLocatorFor(input),
      },
      text: sourceSelection.text,
      attribution: "source-claim",
      classification: "source-claim",
    };

    try {
      await dependencies.workingMaterial.saveAnnotation(annotation);
    } catch (cause: unknown) {
      dependencies.diagnostics?.record(cause);
      return {
        outcome: "operation-failed",
        detail: "The source claim could not be saved as Working Material.",
      };
    }

    return { outcome: "captured", annotation };
  };

  const prepareSynthesis = async (
    input: PrepareSynthesisInput,
  ): Promise<PrepareSynthesisOutcome> => {
    return buildSynthesisPreview(
      input.targetTopic,
      input.provider,
      input.selectedAnnotations.map((annotation) => ({
        kind: "structured-annotation" as const,
        annotationId: annotation.id,
        text: annotation.text,
        sourceRecord: { ...annotation.sourceRecord },
        sourceLocator: annotation.sourceLocator.logical,
        attribution: annotation.attribution,
        classification: annotation.classification,
        state: annotation.state,
      })),
      input.prompt,
    );
  };

  const removeSynthesisContextItem = async (
    input: RemoveSynthesisContextItemInput,
  ): Promise<PrepareSynthesisOutcome> => {
    const remainingContext = input.preview.payload.context.filter(
      (item) => item.annotationId !== input.annotationId,
    );

    if (remainingContext.length === input.preview.payload.context.length) {
      return {
        outcome: "invalid-selection",
        detail: "The selected Synthesis context item was not found.",
      };
    }

    return buildSynthesisPreview(
      input.preview.payload.targetTopic,
      input.preview.provider,
      remainingContext,
      input.preview.prompt,
    );
  };

  const confirmSynthesis = async (
    input: ConfirmSynthesisInput,
  ): Promise<ConfirmSynthesisOutcome> => {
    if (input.confirmation === "declined") {
      return { outcome: "declined" };
    }

    if (input.confirmation === "canceled") {
      return { outcome: "canceled" };
    }

    if (dependencies.model === undefined) {
      return {
        outcome: "agent-provider-unavailable",
        detail: "Synthesis requires a configured Agent Provider.",
      };
    }

    try {
      return await dependencies.model.requestSynthesis(input.preview.payload);
    } catch (cause: unknown) {
      dependencies.diagnostics?.record(cause);
      return {
        outcome: "operation-failed",
        detail: "The Synthesis request could not be completed.",
      };
    }
  };

  const readSynthesisContextIdentities = async (
    input: SaveSynthesisResultInput,
  ): Promise<SynthesisContextIdentities | SaveSynthesisResultOutcome> => {
    const contextIdentities: SynthesisContextIdentities = new Map();

    if (!input.includePromptAndContext) {
      return contextIdentities;
    }

    if (dependencies.sourceIdentity === undefined) {
      return {
        outcome: "operation-failed",
        detail: "The Synthesis source context could not be checked.",
      };
    }

    for (const item of input.preview.payload.context) {
      let identity: SynthesisSourceIdentityOutcome;

      try {
        identity = await dependencies.sourceIdentity.readIdentity(
          item.sourceRecord.id,
        );
      } catch (cause: unknown) {
        dependencies.diagnostics?.record(cause);
        return {
          outcome: "operation-failed",
          detail: "The Synthesis source context could not be checked.",
        };
      }

      if (identity.outcome === "unavailable") {
        return {
          outcome: "operation-failed",
          detail: "The Synthesis source context could not be checked.",
        };
      }

      contextIdentities.set(item.annotationId, {
        sourceIdentity: identity.sourceIdentity,
        contentIdentity: identity.contentIdentity,
      });
    }

    return contextIdentities;
  };

  const saveSynthesisResult = async (
    input: SaveSynthesisResultInput,
  ): Promise<SaveSynthesisResultOutcome> => {
    if (
      input.resultId.length === 0 ||
      input.generatedAt.length === 0 ||
      dependencies.results === undefined
    ) {
      return {
        outcome: "operation-failed",
        detail: "The Synthesis result could not be saved.",
      };
    }

    const contextIdentities = await readSynthesisContextIdentities(input);

    if ("outcome" in contextIdentities) {
      return contextIdentities;
    }

    const result = buildSavedSynthesisResult(input, contextIdentities);

    try {
      await dependencies.results.saveResult(result);
    } catch (cause: unknown) {
      dependencies.diagnostics?.record(cause);
      return {
        outcome: "operation-failed",
        detail: "The Synthesis result could not be saved.",
      };
    }

    return { outcome: "saved", result };
  };

  const checkSynthesisContext = async (
    input: CheckSynthesisContextInput,
  ): Promise<CheckSynthesisContextOutcome> => {
    const snapshots = input.result.contextSnapshot;

    if (snapshots === undefined || snapshots.length === 0) {
      return { outcome: "current", result: input.result };
    }

    if (dependencies.sourceIdentity === undefined) {
      return {
        outcome: "source-status-unavailable",
        result: input.result,
        warning: "source status unavailable",
      };
    }

    for (const snapshot of snapshots) {
      let identity: SynthesisSourceIdentityOutcome;

      try {
        identity = await dependencies.sourceIdentity.readIdentity(
          snapshot.sourceRecord.id,
        );
      } catch (cause: unknown) {
        dependencies.diagnostics?.record(cause);
        return {
          outcome: "source-status-unavailable",
          result: input.result,
          warning: "source status unavailable",
        };
      }

      if (identity.outcome === "unavailable") {
        return {
          outcome: "source-status-unavailable",
          result: input.result,
          warning: "source status unavailable",
        };
      }

      if (
        identity.sourceIdentity !== snapshot.sourceIdentity ||
        identity.contentIdentity !== snapshot.contentIdentity
      ) {
        return {
          outcome: "stale-context",
          result: input.result,
          warning:
            "The saved Synthesis context differs from the current source.",
        };
      }
    }

    return { outcome: "current", result: input.result };
  };

  const refreshSynthesisContext = async (
    input: RefreshSynthesisContextInput,
  ): Promise<RefreshSynthesisContextOutcome> => {
    const snapshots = input.result.contextSnapshot;
    const currentVersion = input.result.contextSnapshotVersion;

    if (
      snapshots === undefined ||
      snapshots.length === 0 ||
      currentVersion === undefined ||
      input.refreshedAt.length === 0 ||
      dependencies.results === undefined ||
      dependencies.sourceIdentity === undefined
    ) {
      return {
        outcome: "operation-failed",
        detail: "The Synthesis context cannot be refreshed.",
      };
    }

    const refreshedSnapshots: SynthesisContextSnapshot[] = [];

    for (const snapshot of snapshots) {
      let identity: SynthesisSourceIdentityOutcome;

      try {
        identity = await dependencies.sourceIdentity.readIdentity(
          snapshot.sourceRecord.id,
        );
      } catch (cause: unknown) {
        dependencies.diagnostics?.record(cause);
        return {
          outcome: "operation-failed",
          detail: "The Synthesis source context could not be checked.",
        };
      }

      if (identity.outcome === "unavailable") {
        return {
          outcome: "operation-failed",
          detail: "The Synthesis source context could not be checked.",
        };
      }

      refreshedSnapshots.push({
        ...snapshot,
        sourceRecord: { ...snapshot.sourceRecord },
        sourceIdentity: identity.sourceIdentity,
        contentIdentity: identity.contentIdentity,
      });
    }

    const refreshedResult: SynthesisSavedResult = {
      ...input.result,
      contextSnapshotVersion: currentVersion + 1,
      contextSnapshot: refreshedSnapshots,
      priorContextSnapshots: [
        ...(input.result.priorContextSnapshots ?? []),
        {
          version: currentVersion,
          refreshedAt:
            input.result.contextSnapshotRefreshedAt ??
            input.result.provenance.generatedAt,
          snapshot: snapshots.map((snapshot) => ({
            ...snapshot,
            sourceRecord: { ...snapshot.sourceRecord },
          })),
        },
      ],
      contextSnapshotRefreshedAt: input.refreshedAt,
    };

    try {
      await dependencies.results.saveResult(refreshedResult);
    } catch (cause: unknown) {
      dependencies.diagnostics?.record(cause);
      return {
        outcome: "operation-failed",
        detail: "The Synthesis result could not be saved.",
      };
    }

    return { outcome: "refreshed", result: refreshedResult };
  };

  const regenerateSynthesisResult = async (
    input: RegenerateSynthesisResultInput,
  ): Promise<RegenerateSynthesisResultOutcome> => {
    if (input.confirmation === "declined") {
      return { outcome: "declined" };
    }

    if (input.confirmation === "canceled") {
      return { outcome: "canceled" };
    }

    if (
      input.previousResult.id.length === 0 ||
      input.generatedAt.length === 0 ||
      dependencies.results === undefined
    ) {
      return {
        outcome: "operation-failed",
        detail: "The Synthesis result could not be regenerated.",
      };
    }

    if (dependencies.model === undefined) {
      return {
        outcome: "agent-provider-unavailable",
        detail: "Synthesis requires a configured Agent Provider.",
      };
    }

    let modelOutcome: SynthesisModelOutcome;

    try {
      modelOutcome = await dependencies.model.requestSynthesis(
        input.preview.payload,
      );
    } catch (cause: unknown) {
      dependencies.diagnostics?.record(cause);
      return {
        outcome: "operation-failed",
        detail: "The Synthesis request could not be completed.",
      };
    }

    if (modelOutcome.outcome !== "draft-proposal") {
      return modelOutcome;
    }

    const regeneratedResult: SynthesisSavedResult = {
      ...input.previousResult,
      title: modelOutcome.draft.title,
      text: modelOutcome.draft.text,
      provenance: {
        ...input.previousResult.provenance,
        provider: input.preview.provider.destination,
        model: input.preview.provider.model,
        generatedAt: input.generatedAt,
        operation: input.preview.payload.operation,
        sourceContext: input.preview.payload.context.map((item) => ({
          annotationId: item.annotationId,
          sourceRecord: { ...item.sourceRecord },
          sourceLocator: item.sourceLocator,
          attribution: item.attribution,
          classification: item.classification,
        })),
      },
      resultVersion: (input.previousResult.resultVersion ?? 1) + 1,
      priorResults: [
        ...(input.previousResult.priorResults ?? []),
        input.previousResult,
      ],
    };

    try {
      await dependencies.results.saveResult(regeneratedResult);
    } catch (cause: unknown) {
      dependencies.diagnostics?.record(cause);
      return {
        outcome: "operation-failed",
        detail: "The Synthesis result could not be regenerated.",
      };
    }

    return { outcome: "regenerated", result: regeneratedResult };
  };

  const restoreSynthesisResult = async (
    input: RestoreSynthesisResultInput,
  ): Promise<RestoreSynthesisResultOutcome> => {
    const currentVersion = input.currentResult.resultVersion ?? 1;
    const priorResults = input.currentResult.priorResults ?? [];
    const restoredResult = priorResults.find(
      (result) => (result.resultVersion ?? 1) === input.version,
    );

    if (
      input.currentResult.id.length === 0 ||
      input.version <= 0 ||
      input.version >= currentVersion ||
      restoredResult === undefined ||
      dependencies.results === undefined
    ) {
      return {
        outcome: "operation-failed",
        detail: "The Synthesis result version could not be restored.",
      };
    }

    const result: SynthesisSavedResult = {
      ...restoredResult,
      resultVersion: currentVersion + 1,
      priorResults: [...priorResults, input.currentResult],
    };

    try {
      await dependencies.results.saveResult(result);
    } catch (cause: unknown) {
      dependencies.diagnostics?.record(cause);
      return {
        outcome: "operation-failed",
        detail: "The Synthesis result version could not be restored.",
      };
    }

    return { outcome: "restored", result };
  };

  const editSynthesisResult = async (
    input: EditSynthesisResultInput,
  ): Promise<EditSynthesisResultOutcome> => {
    const changedFields: ("title" | "text")[] = [];

    if (input.title !== input.result.title) {
      changedFields.push("title");
    }

    if (input.text !== input.result.text) {
      changedFields.push("text");
    }

    if (
      input.result.id.length === 0 ||
      input.title.length === 0 ||
      input.text.length === 0 ||
      input.editedAt.length === 0 ||
      changedFields.length === 0 ||
      dependencies.results === undefined
    ) {
      return {
        outcome: "operation-failed",
        detail: "The Synthesis result could not be edited.",
      };
    }

    const editedResult: SynthesisSavedResult = {
      ...input.result,
      title: input.title,
      text: input.text,
      humanAuthorship: "human-authored",
      humanEdits: [
        ...(input.result.humanEdits ?? []),
        {
          attribution: "human-authored",
          editedAt: input.editedAt,
          changedFields,
        },
      ],
    };

    try {
      await dependencies.results.saveResult(editedResult);
    } catch (cause: unknown) {
      dependencies.diagnostics?.record(cause);
      return {
        outcome: "operation-failed",
        detail: "The Synthesis result could not be edited.",
      };
    }

    return { outcome: "edited", result: editedResult };
  };

  return {
    captureSourceClaim,
    checkSourceAvailability,
    relinkSource,
    prepareSynthesis,
    removeSynthesisContextItem,
    confirmSynthesis,
    saveSynthesisResult,
    checkSynthesisContext,
    refreshSynthesisContext,
    regenerateSynthesisResult,
    restoreSynthesisResult,
    editSynthesisResult,
  };
};
