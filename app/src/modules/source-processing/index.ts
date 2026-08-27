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
}

/** Concrete Adapters composed around the Source Processing policy. */
export interface SourceProcessingDependencies {
  pdf: PdfAdapter;
  workingMaterial: WorkingMaterialRepository;
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

/**
 * Composes capture policy behind the Source Processing Interface. The PDF
 * Adapter resolves source material; this Module owns attribution, locator
 * representation, and the Working Material state.
 */
export const createSourceProcessing = (
  dependencies: SourceProcessingDependencies,
): SourceProcessing => ({
  captureSourceClaim: async (input): Promise<CaptureSourceClaimOutcome> => {
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
  },
});
