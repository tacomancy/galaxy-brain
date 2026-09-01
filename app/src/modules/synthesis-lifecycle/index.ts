import type {
  ConfirmSynthesisOutcome,
  PrepareSynthesisOutcome,
  SourceProcessing,
  SynthesisPreview,
} from "../source-processing";

type LifecycleSourceProcessing = Pick<
  SourceProcessing,
  "removeSynthesisContextItem" | "confirmSynthesis"
>;

/** Dependencies used by the lifecycle Module to delegate policy operations. */
export interface SynthesisLifecycleDependencies {
  sourceProcessingFor(repositoryPath: string): LifecycleSourceProcessing;
}

/** Framework-independent owner of one repository-bound pending Synthesis. */
export interface SynthesisLifecycle {
  /** Stores the latest inspectable preview for one selected repository. */
  prepare(input: {
    repositoryPath: string;
    preview: SynthesisPreview;
  }): PrepareSynthesisOutcome;
  /** Rebuilds the stored preview after removing one context item. */
  removeContextItem(
    repositoryPath: string,
    annotationId: string,
  ): Promise<PrepareSynthesisOutcome>;
  /** Consumes the stored preview at the explicit confirmation boundary. */
  confirm(
    repositoryPath: string,
    confirmation: "confirmed" | "declined" | "canceled",
  ): Promise<ConfirmSynthesisOutcome>;
  /** Invalidates pending state when repository ownership changes. */
  invalidate(): void;
}

type PendingSynthesis = {
  repositoryPath: string;
  preview: SynthesisPreview;
};

/**
 * Creates the transient Synthesis lifecycle Module.
 * @param dependencies Source Processing delegates for the selected repository.
 * @returns The lifecycle Interface.
 */
export const createSynthesisLifecycle = (
  dependencies: SynthesisLifecycleDependencies,
): SynthesisLifecycle => {
  let pending: PendingSynthesis | undefined;

  const prepare = (input: {
    repositoryPath: string;
    preview: SynthesisPreview;
  }): PrepareSynthesisOutcome => {
    pending = {
      repositoryPath: input.repositoryPath,
      preview: input.preview,
    };
    return { outcome: "preview-ready", preview: input.preview };
  };

  const removeContextItem = async (
    repositoryPath: string,
    annotationId: string,
  ): Promise<PrepareSynthesisOutcome> => {
    if (pending === undefined || pending.repositoryPath !== repositoryPath) {
      return {
        outcome: "invalid-selection",
        detail: "Prepare the Synthesis request again before editing it.",
      };
    }

    const updated = await dependencies
      .sourceProcessingFor(repositoryPath)
      .removeSynthesisContextItem({
        preview: pending.preview,
        annotationId,
      });

    if (updated.outcome === "preview-ready") {
      pending = { ...pending, preview: updated.preview };
    }

    return updated;
  };

  const confirm = async (
    repositoryPath: string,
    confirmation: "confirmed" | "declined" | "canceled",
  ): Promise<ConfirmSynthesisOutcome> => {
    if (pending === undefined || pending.repositoryPath !== repositoryPath) {
      return {
        outcome: "operation-failed",
        detail:
          "The Synthesis preview is no longer available. Prepare it again.",
      };
    }

    const preview = pending.preview;
    pending = undefined;
    return dependencies.sourceProcessingFor(repositoryPath).confirmSynthesis({
      preview,
      confirmation,
    });
  };

  return {
    prepare,
    removeContextItem,
    confirm,
    invalidate: () => (pending = undefined),
  };
};
