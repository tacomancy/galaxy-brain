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
  targetTopic?: { id: string; title: string };
}

/** Minimal repository item projection used for explicit Ask selection. */
export type DiscoveryContextCandidate = Pick<
  DiscoveryItem,
  "id" | "title" | "kind" | "authority" | "source"
>;

/** Caller-visible result of reading the selected repository for discovery. */
export type DiscoveryRepositoryReadOutcome =
  | { outcome: "available"; items: DiscoveryItem[] }
  | { outcome: "unavailable"; detail: string };

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
  | { outcome: "repository-unavailable"; detail: string }
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
  | { outcome: "repository-unavailable"; detail: string }
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
  | { outcome: "agent-provider-unavailable"; detail: string };

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
  | { kind: "source-record"; id: string; title: string }
  | {
      kind: "structured-annotation";
      id: string;
      title: string;
      sourceRecordId?: string;
    }
  | {
      kind: "saved-synthesis-result";
      id: string;
      title: string;
      targetTopicId?: string;
    };

/** Caller-visible outcome of resolving a Jump command. */
export type DiscoveryJumpOutcome =
  | { outcome: "resolved"; command: string; target: DiscoveryJumpTarget }
  | { outcome: "not-found"; command: string }
  | { outcome: "repository-unavailable"; detail: string }
  | { outcome: "invalid-command"; detail: string };

/** Narrow external seam for the optional Agent Provider. */
export interface DiscoveryModelAdapter {
  /** External data is unknown until the Module validates its response. */
  requestAsk(payload: AskPayload): Promise<unknown>;
}

/** Repository read seam; it never writes or exposes filesystem paths. */
export interface DiscoveryRepository {
  readDiscoverableItems(): Promise<DiscoveryRepositoryReadOutcome>;
}

/** Input for preparing an evidence-bounded Ask request. */
export interface PrepareAskInput {
  prompt: string;
  contextItemIds: string[];
}

/** Serialized bridge request carrying the user's explicit Ask selection. */
export interface PrepareAskRequest {
  prompt: string;
  contextItemIds: string[];
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
  readAskContextCandidates(): Promise<
    | { outcome: "available"; candidates: DiscoveryContextCandidate[] }
    | { outcome: "repository-unavailable"; detail: string }
  >;
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
  ...(item.targetTopic === undefined
    ? {}
    : { targetTopic: { ...item.targetTopic } }),
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

const workspaceTargetFor = (value: string): DiscoveryJumpTarget | undefined => {
  const targets: Record<string, DiscoveryJumpTarget> = {
    atlas: { kind: "workspace", workspace: "atlas" },
    studio: { kind: "workspace", workspace: "studio" },
    "paper desk": { kind: "workspace", workspace: "paper-desk" },
    "paper-desk": { kind: "workspace", workspace: "paper-desk" },
  };
  return targets[value];
};

const itemTargetFor = (item: DiscoveryItem): DiscoveryJumpTarget => {
  switch (item.kind) {
    case "topic":
      return { kind: "topic", id: item.id, title: item.title };
    case "source-record":
      return { kind: "source-record", id: item.id, title: item.title };
    case "structured-annotation":
      return {
        kind: "structured-annotation",
        id: item.id,
        title: item.title,
        ...(item.source === undefined
          ? {}
          : { sourceRecordId: item.source.sourceRecordId }),
      };
    case "saved-synthesis-result":
      return {
        kind: "saved-synthesis-result",
        id: item.id,
        title: item.title,
        ...(item.targetTopic === undefined
          ? {}
          : { targetTopicId: item.targetTopic.id }),
      };
  }
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

  const target = workspaceTargetFor(value);
  if (target !== undefined) {
    return { outcome: "resolved", command, target };
  }

  const item = items.find(
    (candidate) =>
      normalized(candidate.title) === value ||
      normalized(candidate.id) === value,
  );
  return item === undefined
    ? { outcome: "not-found", command }
    : { outcome: "resolved", command, target: itemTargetFor(item) };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAuthority = (value: unknown): value is DiscoveryAuthority =>
  value === "core-knowledge" ||
  value === "source-record" ||
  value === "working-material";

const isSourceReference = (value: unknown): value is DiscoverySourceReference =>
  isRecord(value) &&
  typeof value.sourceRecordId === "string" &&
  value.sourceRecordId.length > 0 &&
  typeof value.sourceRecordTitle === "string" &&
  value.sourceRecordTitle.length > 0 &&
  (value.locator === undefined ||
    (typeof value.locator === "string" && value.locator.length > 0));

const validAnswer = (
  value: unknown,
  context: AskContextItem[],
): value is AskAnswer => {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.text !== "string" ||
    value.text.trim().length === 0 ||
    !Array.isArray(value.citations) ||
    !Array.isArray(value.uncertainty) ||
    !Array.isArray(value.conflicts)
  ) {
    return false;
  }

  return (
    value.citations.every((citation): citation is AskCitation => {
      if (
        !isRecord(citation) ||
        typeof citation.itemId !== "string" ||
        typeof citation.title !== "string" ||
        citation.itemId.trim().length === 0 ||
        citation.title.trim().length === 0 ||
        !isAuthority(citation.authority)
      ) {
        return false;
      }
      const source = citation.source;
      return (
        context.some((item) => item.id === citation.itemId) &&
        (source === undefined || isSourceReference(source))
      );
    }) &&
    value.uncertainty.every(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    ) &&
    value.conflicts.every(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    )
  );
};

const modelOutcomeFrom = (
  value: unknown,
  context: AskContextItem[],
): ConfirmAskOutcome => {
  if (!isRecord(value) || typeof value.outcome !== "string") {
    return {
      outcome: "operation-failed",
      detail: "The Agent Provider returned an invalid Ask response.",
    };
  }
  if (value.outcome === "agent-provider-unavailable") {
    return typeof value.detail === "string"
      ? { outcome: value.outcome, detail: value.detail }
      : {
          outcome: "operation-failed",
          detail: "The Agent Provider returned an invalid Ask response.",
        };
  }
  if (value.outcome === "answered" && validAnswer(value.answer, context)) {
    return { outcome: "answered", answer: value.answer };
  }
  return {
    outcome: "operation-failed",
    detail: "The Agent Provider returned an invalid Ask response.",
  };
};

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
  const readItems = async (): Promise<DiscoveryRepositoryReadOutcome> => {
    try {
      const outcome = await repository.readDiscoverableItems();
      return outcome.outcome === "available"
        ? { outcome: "available", items: outcome.items.map(copiedItem) }
        : outcome;
    } catch {
      return {
        outcome: "unavailable",
        detail: "The selected Knowledge Repository could not be read.",
      };
    }
  };

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

    if (contextItemIds.length === 0) {
      return {
        outcome: "unsupported",
        detail: "Select at least one repository item before preparing an Ask.",
      };
    }

    const repositoryOutcome = await readItems();
    if (repositoryOutcome.outcome === "unavailable") {
      return {
        outcome: "repository-unavailable",
        detail: repositoryOutcome.detail,
      };
    }
    const selected = contextItemIds
      .map((id) => repositoryOutcome.items.find((item) => item.id === id))
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

      const repositoryOutcome = await readItems();
      if (repositoryOutcome.outcome === "unavailable") {
        return {
          outcome: "repository-unavailable",
          detail: repositoryOutcome.detail,
        };
      }
      const items = repositoryOutcome.items;
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

    readAskContextCandidates: async () => {
      const repositoryOutcome = await readItems();
      if (repositoryOutcome.outcome === "unavailable") {
        return {
          outcome: "repository-unavailable",
          detail: repositoryOutcome.detail,
        };
      }
      return {
        outcome: "available",
        candidates: repositoryOutcome.items.map(
          ({ id, title, kind, authority, source }) => ({
            id,
            title,
            kind,
            authority,
            ...(source === undefined ? {} : { source: { ...source } }),
          }),
        ),
      };
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

      let outcome: unknown;
      try {
        outcome = await model.requestAsk(preview.payload);
      } catch {
        return {
          outcome: "operation-failed",
          detail: "The Agent Provider request failed.",
        };
      }
      return modelOutcomeFrom(outcome, preview.context);
    },

    jump: async (command): Promise<DiscoveryJumpOutcome> => {
      const repositoryOutcome = await readItems();
      if (repositoryOutcome.outcome === "unavailable") {
        return {
          outcome: "repository-unavailable",
          detail: repositoryOutcome.detail,
        };
      }
      return parseJump(command, repositoryOutcome.items);
    },
  };
};
