/** A trust-bearing category shown alongside every discovered repository item. */
export type DiscoveryAuthority =
  "core-knowledge" | "source-record" | "working-material";

/** The portable item kinds indexed by the first Discovery slice. */
export type DiscoveryItemKind =
  | "topic"
  | "source-record"
  | "structured-annotation"
  | "saved-synthesis-result";

/** A stable source location attached to an item or Ask citation. */
export interface DiscoverySourceReference {
  sourceRecordId: string;
  sourceRecordTitle: string;
  locator?: string;
}

/** One item returned by local repository retrieval. */
export interface DiscoveryItem {
  id: string;
  title: string;
  kind: DiscoveryItemKind;
  authority: DiscoveryAuthority;
  text: string;
  source?: DiscoverySourceReference;
}

/** A Search result with the bounded text displayed to the caller. */
export interface DiscoverySearchResult {
  id: string;
  title: string;
  kind: DiscoveryItemKind;
  authority: DiscoveryAuthority;
  excerpt: string;
  source?: DiscoverySourceReference;
}

/** Caller-visible outcome of local Search retrieval. */
export type DiscoverySearchOutcome =
  | { outcome: "found"; query: string; results: DiscoverySearchResult[] }
  | { outcome: "no-match"; query: string }
  | { outcome: "invalid-query"; detail: string };

/** The exact source-bound context sent to the external Model Adapter. */
export interface AskContextItem {
  id: string;
  title: string;
  kind: DiscoveryItemKind;
  authority: DiscoveryAuthority;
  text: string;
  source?: DiscoverySourceReference;
}

/** Exact outbound data shown before an Ask request is confirmed. */
export interface AskPayload {
  operation: "ask";
  model: string;
  prompt: string;
  context: AskContextItem[];
}

/** An inspectable Ask preview. */
export interface AskPreview {
  summary: string;
  destination: string;
  model: string;
  estimatedRequestSize: number;
  context: AskContextItem[];
  payload: AskPayload;
}

/** Caller-visible outcome of preparing an Ask request. */
export type PrepareAskOutcome =
  | { outcome: "preview-ready"; preview: AskPreview }
  | { outcome: "unsupported"; detail: string }
  | { outcome: "invalid-prompt"; detail: string };

/** A citation returned by the Model Adapter and shown with an Ask answer. */
export interface AskCitation {
  itemId: string;
  title: string;
  authority: DiscoveryAuthority;
  source?: DiscoverySourceReference;
}

/** Structured response required from an external Ask Model Adapter. */
export interface AskAnswer {
  text: string;
  citations: AskCitation[];
  uncertainty: string[];
  conflicts: string[];
}

/** Narrow Model Adapter outcomes for a confirmed Ask request. */
export type AskModelOutcome =
  | { outcome: "answered"; answer: AskAnswer }
  | { outcome: "agent-provider-unavailable"; detail: string }
  | { outcome: "invalid-response"; detail: string };

/** The user decision at the final Ask transmission boundary. */
export type AskConfirmation = "confirmed" | "declined" | "canceled";

/** Caller-visible outcome after the Ask confirmation boundary. */
export type ConfirmAskOutcome =
  | AskModelOutcome
  | { outcome: "declined" }
  | { outcome: "canceled" }
  | { outcome: "operation-failed"; detail: string };

/** Known Workbench destination returned by Jump. */
export type DiscoveryJumpTarget =
  | { kind: "workspace"; workspace: "atlas" | "studio" | "paper-desk" }
  | { kind: "topic"; id: string; title: string }
  | { kind: "source-record"; id: string; title: string };

/** Caller-visible outcome of resolving a Jump command. */
export type DiscoveryJumpOutcome =
  | { outcome: "resolved"; command: string; target: DiscoveryJumpTarget }
  | { outcome: "not-found"; command: string }
  | { outcome: "invalid-command"; detail: string };

/** Narrow external seam for the optional Agent Provider. */
export interface DiscoveryModelAdapter {
  requestAsk(payload: AskPayload): Promise<AskModelOutcome>;
}

/** Repository read seam; it never writes or exposes filesystem paths. */
export interface DiscoveryRepository {
  readDiscoverableItems(): Promise<DiscoveryItem[]>;
}

/** Input for preparing an evidence-bounded Ask request. */
export interface PrepareAskInput {
  prompt: string;
  contextItemIds?: string[];
}

/** Input for removing one complete Ask context item. */
export interface RemoveAskContextItemInput {
  preview: AskPreview;
  itemId: string;
}

/** Input for applying a user's final Ask decision. */
export interface ConfirmAskInput {
  preview: AskPreview;
  confirmation: AskConfirmation;
}

/** Public S4 Module Interface for explicit Search, Ask, and Jump behavior. */
export interface Discovery {
  search(query: string): Promise<DiscoverySearchOutcome>;
  prepareAsk(input: PrepareAskInput): Promise<PrepareAskOutcome>;
  removeAskContextItem(
    input: RemoveAskContextItemInput,
  ): Promise<PrepareAskOutcome>;
  confirmAsk(input: ConfirmAskInput): Promise<ConfirmAskOutcome>;
  jump(command: string): Promise<DiscoveryJumpOutcome>;
}

/** Adapters and presentation configuration used to compose Discovery. */
export interface DiscoveryDependencies {
  repository: DiscoveryRepository;
  model?: DiscoveryModelAdapter;
  destination?: string;
  modelName?: string;
}

const defaultDestination = "OpenAI API";
const defaultModelName = "fixture-pinned-model";

const normalized = (value: string): string => value.trim().toLocaleLowerCase();

const excerptFor = (text: string, query: string): string => {
  const index = normalized(text).indexOf(normalized(query));
  if (index < 0 || text.length <= 160) {
    return text.slice(0, 160);
  }

  const start = Math.max(0, index - 60);
  return text.slice(start, start + 160);
};

const searchRank = (item: DiscoveryItem, query: string): number => {
  const needle = normalized(query);
  if (normalized(item.title).includes(needle)) {
    return 0;
  }

  return 1;
};

const kindRank = (kind: DiscoveryItemKind): number => {
  switch (kind) {
    case "topic":
      return 0;
    case "source-record":
      return 1;
    case "structured-annotation":
      return 2;
    case "saved-synthesis-result":
      return 3;
  }
};

const askContextFrom = (item: DiscoveryItem): AskContextItem => ({
  id: item.id,
  title: item.title,
  kind: item.kind,
  authority: item.authority,
  text: item.text,
  ...(item.source === undefined ? {} : { source: { ...item.source } }),
});

const copiedItem = (item: DiscoveryItem): DiscoveryItem => ({
  ...item,
  ...(item.source === undefined ? {} : { source: { ...item.source } }),
});

const payloadSizeFor = (payload: AskPayload): number =>
  JSON.stringify(payload).length;

const summaryFor = (
  prompt: string,
  context: AskContextItem[],
  destination: string,
  model: string,
): string =>
  `Ask ${context.length} selected context item${context.length === 1 ? "" : "s"} using model "${model}" via ${destination}; prompt: ${prompt}`;

const previewFor = (
  prompt: string,
  context: AskContextItem[],
  destination: string,
  model: string,
): AskPreview => {
  const payload: AskPayload = {
    operation: "ask",
    model,
    prompt,
    context,
  };

  return {
    summary: summaryFor(prompt, context, destination, model),
    destination,
    model,
    estimatedRequestSize: payloadSizeFor(payload),
    context,
    payload,
  };
};

const parseJump = (
  command: string,
  items: DiscoveryItem[],
): DiscoveryJumpOutcome => {
  const value = normalized(command);
  if (value.length === 0) {
    return {
      outcome: "invalid-command",
      detail: "Enter a known Workbench destination or command.",
    };
  }

  const workspace =
    value === "atlas"
      ? "atlas"
      : value === "studio"
        ? "studio"
        : value === "paper desk" || value === "paper-desk"
          ? "paper-desk"
          : undefined;
  if (workspace !== undefined) {
    return {
      outcome: "resolved",
      command,
      target: { kind: "workspace", workspace },
    };
  }

  const item = items.find(
    (candidate) =>
      (candidate.kind === "topic" || candidate.kind === "source-record") &&
      (normalized(candidate.title) === value ||
        normalized(candidate.id) === value),
  );
  if (item?.kind === "topic") {
    return {
      outcome: "resolved",
      command,
      target: { kind: "topic", id: item.id, title: item.title },
    };
  }
  if (item?.kind === "source-record") {
    return {
      outcome: "resolved",
      command,
      target: { kind: "source-record", id: item.id, title: item.title },
    };
  }

  return { outcome: "not-found", command };
};

const validAnswer = (answer: AskAnswer): boolean =>
  answer.text.trim().length > 0 &&
  answer.citations.every(
    (citation) =>
      citation.itemId.trim().length > 0 && citation.title.trim().length > 0,
  ) &&
  answer.uncertainty.every((item) => item.trim().length > 0) &&
  answer.conflicts.every((item) => item.trim().length > 0);

/**
 * Creates the S4 Discovery Module and keeps repository policy out of the UI.
 * @param dependencies Repository and optional Model Adapter dependencies.
 * @returns The public Discovery Module Interface.
 */
export const createDiscovery = ({
  repository,
  model,
  destination = defaultDestination,
  modelName = defaultModelName,
}: DiscoveryDependencies): Discovery => {
  const readItems = async (): Promise<DiscoveryItem[]> =>
    (await repository.readDiscoverableItems()).map(copiedItem);

  const prepareAsk = async ({
    prompt,
    contextItemIds,
  }: PrepareAskInput): Promise<PrepareAskOutcome> => {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
      return {
        outcome: "invalid-prompt",
        detail: "Enter a question before preparing an Ask request.",
      };
    }

    const items = await readItems();
    const selected =
      contextItemIds === undefined
        ? items.filter((item) =>
            trimmedPrompt
              .toLocaleLowerCase()
              .split(/\s+/u)
              .some(
                (word) =>
                  word.length > 3 &&
                  `${item.title} ${item.text}`
                    .toLocaleLowerCase()
                    .includes(word),
              ),
          )
        : contextItemIds
            .map((id) => items.find((item) => item.id === id))
            .filter((item): item is DiscoveryItem => item !== undefined);

    const context = selected.map(askContextFrom);
    if (context.length === 0) {
      return {
        outcome: "unsupported",
        detail: "The selected Knowledge Repository does not support this Ask.",
      };
    }

    const preview = previewFor(trimmedPrompt, context, destination, modelName);
    return { outcome: "preview-ready", preview };
  };

  return {
    search: async (query): Promise<DiscoverySearchOutcome> => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) {
        return {
          outcome: "invalid-query",
          detail: "Enter a Search term.",
        };
      }

      const items = await readItems();
      const results = items
        .filter((item) =>
          `${item.title} ${item.text}`
            .toLocaleLowerCase()
            .includes(trimmedQuery.toLocaleLowerCase()),
        )
        .sort(
          (left, right) =>
            searchRank(left, trimmedQuery) - searchRank(right, trimmedQuery) ||
            kindRank(left.kind) - kindRank(right.kind) ||
            left.id.localeCompare(right.id),
        )
        .map((item) => ({
          id: item.id,
          title: item.title,
          kind: item.kind,
          authority: item.authority,
          excerpt: excerptFor(item.text, trimmedQuery),
          ...(item.source === undefined ? {} : { source: { ...item.source } }),
        }));

      return results.length === 0
        ? { outcome: "no-match", query: trimmedQuery }
        : { outcome: "found", query: trimmedQuery, results };
    },

    prepareAsk,

    removeAskContextItem: async ({
      preview,
      itemId,
    }): Promise<PrepareAskOutcome> => {
      const context = preview.context.filter((item) => item.id !== itemId);
      if (context.length === 0) {
        return {
          outcome: "unsupported",
          detail: "At least one context item is required for this Ask.",
        };
      }

      return {
        outcome: "preview-ready",
        preview: previewFor(
          preview.payload.prompt,
          context,
          preview.destination,
          preview.model,
        ),
      };
    },

    confirmAsk: async ({
      preview,
      confirmation,
    }): Promise<ConfirmAskOutcome> => {
      if (confirmation === "declined") {
        return { outcome: "declined" };
      }
      if (confirmation === "canceled") {
        return { outcome: "canceled" };
      }
      if (model === undefined) {
        return {
          outcome: "agent-provider-unavailable",
          detail: "Ask requires a configured Agent Provider.",
        };
      }

      const outcome = await model.requestAsk(preview.payload);
      if (outcome.outcome === "answered" && !validAnswer(outcome.answer)) {
        return {
          outcome: "invalid-response",
          detail: "The Agent Provider returned an invalid Ask response.",
        };
      }

      return outcome;
    },

    jump: async (command): Promise<DiscoveryJumpOutcome> =>
      parseJump(command, await readItems()),
  };
};

/**
 * Creates the deterministic repository Adapter used by S4 tests and fixture composition.
 * @param items Independently defined repository items exposed to Discovery.
 * @returns A read-only Discovery repository Adapter.
 */
export const createInMemoryDiscoveryRepository = (
  items: DiscoveryItem[],
): DiscoveryRepository => ({
  readDiscoverableItems: async () => items.map(copiedItem),
});
