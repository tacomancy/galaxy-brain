import type {
  CaptureSourceClaimInput,
  PdfAdapter,
  PdfSelectionOutcome,
} from "../../modules/source-processing";

const fixtureSourceRecord = {
  id: "bayesian-statistics-fixture-source",
  title: "Bayesian statistics fixture source",
};
const fixturePassage = "Bayesian inference updates prior belief with evidence.";
const fixturePassageEnd = 54;

/** Deterministic PDF Adapter for the independently specified TB5 fixture. */
export const createFixturePdfAdapter = (): PdfAdapter => ({
  readSelection: async (
    input: CaptureSourceClaimInput,
  ): Promise<PdfSelectionOutcome> => {
    if (
      input.sourceRecord.id !== fixtureSourceRecord.id ||
      input.sourceRecord.title !== fixtureSourceRecord.title ||
      input.page !== 2 ||
      input.start !== 0 ||
      input.end !== fixturePassageEnd
    ) {
      return {
        outcome: "source-unavailable",
        detail: "The requested fixture PDF passage is unavailable.",
      };
    }

    return { outcome: "located", text: fixturePassage };
  },
});
