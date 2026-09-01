import type {
  AskModelOutcome,
  DiscoveryModelAdapter,
} from "../../modules/discovery";

/**
 * Returns a deterministic answer for packaged S1 review and local tests.
 * It intentionally accepts only the narrow Ask payload rather than exposing
 * a provider SDK or making the fixture path appear to be a live integration.
 * @returns A deterministic fixture Model Adapter.
 */
export const createFixtureDiscoveryModelAdapter =
  (): DiscoveryModelAdapter => ({
    requestAsk: async (payload): Promise<AskModelOutcome> => ({
      outcome: "answered",
      answer: {
        text: "The fixture says Bayesian inference updates prior belief with evidence.",
        citations: payload.context.map((item) => ({
          itemId: item.id,
          title: item.title,
          authority: item.authority,
          ...(item.source === undefined ? {} : { source: { ...item.source } }),
        })),
        uncertainty: [
          "This answer is limited to the selected Knowledge Repository context.",
        ],
        conflicts: [],
      },
    }),
  });
