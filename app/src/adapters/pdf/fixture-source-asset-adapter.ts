import type {
  CaptureSourceClaimInput,
  PdfAdapter,
  SourceAssetAdapter,
  SourceAssetIdentity,
  SourceAssetIdentityOutcome,
  SourceAssetRelinkOutcome,
  SourceRecordReference,
} from "../../modules/source-processing";

/** Configuration for the deterministic linked Source Asset fixture Adapter. */
export interface FixtureSourceAssetAdapterOptions {
  sourceRecord: SourceRecordReference;
  initialIdentity: SourceAssetIdentity;
  currentIdentity?: SourceAssetIdentity;
  replacementIdentity: SourceAssetIdentity | null;
  replacementReference: string;
  pdf: PdfAdapter;
}

/**
 * Creates a deterministic Source Asset Adapter for S3 behavior tests. It
 * exercises the PDF Adapter for the requested locator and changes its
 * machine-local identity only after identity and locator verification pass.
 * @param options Fixture identities, source reference, and PDF Adapter.
 * @returns A stateful Source Asset Adapter with isolated fixture state.
 */
export const createFixtureSourceAssetAdapter = (
  options: FixtureSourceAssetAdapterOptions,
): SourceAssetAdapter => {
  let recordedIdentity = options.initialIdentity;
  let currentIdentity = options.currentIdentity ?? options.initialIdentity;

  const readIdentity = async (
    sourceRecordId: string,
  ): Promise<SourceAssetIdentityOutcome> => {
    if (sourceRecordId !== options.sourceRecord.id) {
      return {
        outcome: "unavailable",
        detail: "The requested fixture Source Record is unavailable.",
      };
    }

    return {
      outcome: "available",
      recorded: { ...recordedIdentity },
      current: { ...currentIdentity },
    };
  };

  const relink = async (
    input: Parameters<SourceAssetAdapter["relink"]>[0],
  ): Promise<SourceAssetRelinkOutcome> => {
    if (input.sourceRecord.id !== options.sourceRecord.id) {
      return {
        outcome: "unavailable",
        detail: "The requested fixture Source Record is unavailable.",
      };
    }

    if (options.replacementIdentity === null) {
      return {
        outcome: "unavailable",
        detail: "The replacement fixture PDF is unavailable.",
      };
    }

    if (input.replacementReference !== options.replacementReference) {
      return {
        outcome: "unavailable",
        detail: "The requested replacement fixture PDF is unavailable.",
      };
    }

    const selectionInput: CaptureSourceClaimInput = {
      sourceRecord: input.sourceRecord,
      ...input.verificationLocator,
    };
    const selection = await options.pdf.readSelection(selectionInput);

    if (selection.outcome === "source-unavailable") {
      return { outcome: "unavailable", detail: selection.detail };
    }

    if (
      selection.text.length !==
      input.verificationLocator.end - input.verificationLocator.start
    ) {
      return {
        outcome: "unavailable",
        detail: "The replacement fixture passage does not match its locator.",
      };
    }

    if (
      options.replacementIdentity.sourceIdentity !==
        input.expectedReplacementSourceIdentity ||
      options.replacementIdentity.contentIdentity !==
        input.expectedReplacementContentIdentity
    ) {
      return {
        outcome: "changed",
        recorded: { ...recordedIdentity },
        current: { ...options.replacementIdentity },
      };
    }

    recordedIdentity = options.replacementIdentity;
    currentIdentity = options.replacementIdentity;
    return {
      outcome: "available",
      recorded: { ...recordedIdentity },
      current: { ...currentIdentity },
    };
  };

  return { readIdentity, relink };
};
