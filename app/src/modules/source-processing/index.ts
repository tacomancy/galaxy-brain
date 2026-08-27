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

/** Concise and exact views of one pending Synthesis operation. */
export interface SynthesisPreview {
  summary: string;
  estimatedRequestSize: number;
  provider: SynthesisProviderReference;
  payload: SynthesisPayload;
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
}

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

/** Adapter seam for durable or locally substitutable Working Material. */
export interface WorkingMaterialRepository {
  /** Persists one source annotation as Working Material. */
  saveAnnotation(annotation: StructuredAnnotation): Promise<void>;
  /** Reopens an annotation or returns a caller-meaningful read outcome. */
  readAnnotation(annotationId: string): Promise<WorkingMaterialReadOutcome>;
  /** Finds the saved annotation associated with one Source Record. */
  readAnnotationForSourceRecord(
    sourceRecordId: string,
  ): Promise<WorkingMaterialReadOutcome>;
}

/** Caller-visible result of the first source-claim capture behavior. */
export type CaptureSourceClaimOutcome =
  | { outcome: "captured"; annotation: StructuredAnnotation }
  | { outcome: "source-unavailable"; detail: string }
  | { outcome: "invalid-locator"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/** Public Source Processing behavior used by S3 callers and tests. */
export interface SourceProcessing {
  /** Captures a located source claim without creating Synthesis or a Proposal. */
  captureSourceClaim(
    input: CaptureSourceClaimInput,
  ): Promise<CaptureSourceClaimOutcome>;
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
}

/** Concrete Adapters composed around the Source Processing policy. */
export interface SourceProcessingDependencies {
  pdf: PdfAdapter;
  workingMaterial: WorkingMaterialRepository;
  model?: SynthesisModelAdapter;
  diagnostics?: SourceProcessingDiagnostics;
}

/** Internal diagnostic sink; causes stay outside caller-visible outcomes. */
export interface SourceProcessingDiagnostics {
  record(cause: unknown): void;
}

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
): PrepareSynthesisOutcome => {
  if (
    context.length === 0 ||
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
  const claimLabel = context.length === 1 ? "source claim" : "source claims";

  return {
    outcome: "preview-ready",
    preview: {
      summary: `Synthesize ${context.length} selected ${claimLabel} into "${targetTopic.title}" using model "${provider.model}" via ${provider.destination}; ${estimatedRequestSize} source characters selected.`,
      estimatedRequestSize,
      provider: { ...provider },
      payload: {
        operation: "synthesize-into-topic",
        model: provider.model,
        targetTopic: { ...targetTopic },
        context: context.map((item) => ({
          ...item,
          sourceRecord: { ...item.sourceRecord },
        })),
      },
    },
  };
};

/**
 * Composes capture policy behind the Source Processing Interface. The PDF
 * Adapter resolves source material; this Module owns attribution, locator
 * representation, and the Working Material state.
 */
export const createSourceProcessing = (
  dependencies: SourceProcessingDependencies,
): SourceProcessing => {
  const captureSourceClaim = async (
    input: CaptureSourceClaimInput,
  ): Promise<CaptureSourceClaimOutcome> => {
    if (!isValidLocator(input)) {
      return {
        outcome: "invalid-locator",
        detail: "The source locator is invalid.",
      };
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

  return {
    captureSourceClaim,
    prepareSynthesis,
    removeSynthesisContextItem,
    confirmSynthesis,
  };
};
