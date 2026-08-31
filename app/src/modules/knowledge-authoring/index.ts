/** The representations exposed by the Knowledge Authoring Module. */
export type AuthoringMode = "rich" | "source";

/** The bounded semantic constructs demonstrated by TB11. */
export type AuthoringConstruct =
  "highlight" | "link" | "embed" | "callout" | "equation" | "citation";

/** Stable order for the TB11 construct examples shown in the authoring view. */
export const authoringConstructs: readonly AuthoringConstruct[] = [
  "highlight",
  "link",
  "embed",
  "callout",
  "equation",
  "citation",
];

/** The transient draft supplied at the composition seam. */
export interface AuthoringDraftInput {
  id: string;
  topicId: string;
  title: string;
  state: "working-material";
  construct: AuthoringConstruct;
  source: string;
}

/** The semantic rich projection of the current authoring draft. */
export interface RichAuthoringProjection {
  construct: AuthoringConstruct;
  semanticText: string;
  /** Retained for the first highlight slice's caller-facing vocabulary. */
  highlightedText: string;
  highlighted: boolean;
}

/** The caller-facing authoring view returned after each operation. */
export interface AuthoringDraftView {
  id: string;
  topicId: string;
  title: string;
  state: "working-material";
  construct: AuthoringConstruct;
  mode: AuthoringMode;
  rich: RichAuthoringProjection;
  source: string;
}

/** Caller-visible failure for an unavailable or invalid authoring draft. */
export type AuthoringFailure = {
  outcome: "not-available" | "operation-failed";
  detail: string;
};

/** Result of opening or reading the current transient authoring draft. */
export type AuthoringReadOutcome =
  { outcome: "available"; draft: AuthoringDraftView } | AuthoringFailure;

/** Result of a semantic edit or representation change. */
export type AuthoringOperationOutcome =
  { outcome: "updated"; draft: AuthoringDraftView } | AuthoringFailure;

/** Composition seam for transient or future persisted Working Material drafts. */
export interface AuthoringDraftSource {
  readDraft(
    construct?: AuthoringConstruct,
  ): Promise<AuthoringDraftInput | undefined>;
}

/** Knowledge Authoring Module Interface for the TB11 rich/source slices. */
export interface KnowledgeAuthoring {
  /** Opens the current transient draft and returns its current projection. */
  readDraft(): Promise<AuthoringReadOutcome>;
  /** Opens one of the bounded construct examples in the current session. */
  openConstruct(construct: AuthoringConstruct): Promise<AuthoringReadOutcome>;
  /** Changes the text inside the current semantic object. */
  editSemanticText(nextText: string): Promise<AuthoringOperationOutcome>;
  /** Reverts the most recent semantic edit in the current draft session. */
  undoLastEdit(): Promise<AuthoringOperationOutcome>;
  /** Changes which equivalent representation the caller displays. */
  setMode(mode: AuthoringMode): Promise<AuthoringOperationOutcome>;
}

interface ParsedDraft {
  construct: AuthoringConstruct;
  prefix: string;
  value: string;
  suffix: string;
}

interface ConstructPattern {
  construct: AuthoringConstruct;
  find(
    source: string,
  ): { index: number; length: number; value: string } | undefined;
  serialize(value: string): string;
}

const singleMatch = (
  source: string,
  expression: RegExp,
): { index: number; length: number; value: string } | undefined => {
  const matches = [...source.matchAll(expression)];

  if (matches.length !== 1) {
    return undefined;
  }

  const match = matches[0];
  const value = match?.[1];
  const index = match?.index;

  if (match === undefined || value === undefined || index === undefined) {
    return undefined;
  }

  return { index, length: match[0].length, value };
};

const constructPatterns: readonly ConstructPattern[] = [
  {
    construct: "highlight",
    find: (source) => singleMatch(source, /==([^=\n]+)==/g),
    serialize: (value) => `==${value}==`,
  },
  {
    construct: "embed",
    find: (source) => singleMatch(source, /!\[\[([^\]\n]+)\]\]/g),
    serialize: (value) => `![[${value}]]`,
  },
  {
    construct: "link",
    find: (source) => singleMatch(source, /(?<!!)\[\[([^\]\n]+)\]\]/g),
    serialize: (value) => `[[${value}]]`,
  },
  {
    construct: "callout",
    find: (source) => singleMatch(source, /^> \[!EVIDENCE\] ([^\n]+)$/gm),
    serialize: (value) => `> [!EVIDENCE] ${value}`,
  },
  {
    construct: "equation",
    find: (source) => singleMatch(source, /\$(?!\$)([^$\n]+)\$(?!\$)/g),
    serialize: (value) => `$${value}$`,
  },
  {
    construct: "citation",
    find: (source) => singleMatch(source, /\[@([^\]\n]+)\]/g),
    serialize: (value) => `[@${value}]`,
  },
];

const patternFor = (construct: AuthoringConstruct): ConstructPattern =>
  constructPatterns.find((pattern) => pattern.construct === construct) ??
  constructPatterns[0]!;

const parseDraft = (source: string): ParsedDraft | undefined => {
  const matches = constructPatterns.flatMap((pattern) => {
    const match = pattern.find(source);
    return match === undefined ? [] : [{ pattern, match }];
  });
  const found = matches[0];

  if (matches.length !== 1 || found === undefined) {
    return undefined;
  }

  return {
    construct: found.pattern.construct,
    prefix: source.slice(0, found.match.index),
    value: found.match.value,
    suffix: source.slice(found.match.index + found.match.length),
  };
};

const serializeDraft = (parsed: ParsedDraft, value: string): string =>
  `${parsed.prefix}${patternFor(parsed.construct).serialize(value)}${parsed.suffix}`;

const toView = (
  input: AuthoringDraftInput,
  parsed: ParsedDraft,
  mode: AuthoringMode,
  source: string,
): AuthoringDraftView => ({
  id: input.id,
  topicId: input.topicId,
  title: input.title,
  state: input.state,
  construct: parsed.construct,
  mode,
  rich: {
    construct: parsed.construct,
    semanticText: parsed.value,
    highlightedText: parsed.value,
    highlighted: parsed.construct === "highlight",
  },
  source,
});

const invalidSemanticText = (
  construct: AuthoringConstruct,
  value: string,
): boolean => {
  if (value.length === 0 || value.includes("\n")) {
    return true;
  }

  if (construct === "highlight") {
    return value.includes("==");
  }

  if (construct === "link" || construct === "embed") {
    return value.includes("]]");
  }

  if (construct === "equation") {
    return value.includes("$");
  }

  if (construct === "citation") {
    return value.includes("]");
  }

  return false;
};

const unavailable = (detail: string): AuthoringFailure => ({
  outcome: "not-available",
  detail,
});

/**
 * Composes transient authoring state behind the Knowledge Authoring Interface.
 * The Module is the only owner of parsing, serialization, and semantic edit
 * rules; callers receive projections rather than the internal document model.
 * @param source The Adapter that supplies the initial Working Material draft.
 * @returns The Knowledge Authoring Module Interface.
 */
export const createKnowledgeAuthoring = (
  source: AuthoringDraftSource,
): KnowledgeAuthoring => {
  let input: AuthoringDraftInput | undefined;
  let parsed: ParsedDraft | undefined;
  let currentSource: string | undefined;
  let mode: AuthoringMode = "rich";
  let undoState: { parsed: ParsedDraft; source: string } | undefined;

  const loadDraft = async (
    requestedConstruct?: AuthoringConstruct,
  ): Promise<AuthoringReadOutcome> => {
    const nextInput = await source.readDraft(requestedConstruct);

    if (nextInput === undefined) {
      return unavailable("No Working Material authoring draft is available.");
    }

    const nextParsed = parseDraft(nextInput.source);

    if (
      nextParsed === undefined ||
      (requestedConstruct !== undefined &&
        nextParsed.construct !== requestedConstruct)
    ) {
      return {
        outcome: "operation-failed",
        detail: "The authoring draft does not contain one supported construct.",
      };
    }

    input = nextInput;
    parsed = nextParsed;
    currentSource = nextInput.source;
    mode = "rich";
    undoState = undefined;

    return {
      outcome: "available",
      draft: toView(nextInput, nextParsed, mode, nextInput.source),
    };
  };

  const readDraft = async (): Promise<AuthoringReadOutcome> => {
    if (
      input !== undefined &&
      parsed !== undefined &&
      currentSource !== undefined
    ) {
      return {
        outcome: "available",
        draft: toView(input, parsed, mode, currentSource),
      };
    }

    return loadDraft();
  };

  const openConstruct = async (
    construct: AuthoringConstruct,
  ): Promise<AuthoringReadOutcome> => loadDraft(construct);

  const editSemanticText = async (
    nextText: string,
  ): Promise<AuthoringOperationOutcome> => {
    const current = await readDraft();

    if (current.outcome !== "available") {
      return current;
    }

    if (
      input === undefined ||
      parsed === undefined ||
      currentSource === undefined
    ) {
      return {
        outcome: "operation-failed",
        detail: "The authoring draft is no longer available.",
      };
    }

    if (invalidSemanticText(parsed.construct, nextText)) {
      return {
        outcome: "operation-failed",
        detail:
          "A semantic object must contain one valid nonempty line of text.",
      };
    }

    undoState = { parsed, source: currentSource };
    currentSource = serializeDraft(parsed, nextText);
    parsed = { ...parsed, value: nextText };

    return {
      outcome: "updated",
      draft: toView(input, parsed, mode, currentSource),
    };
  };

  const undoLastEdit = async (): Promise<AuthoringOperationOutcome> => {
    const current = await readDraft();

    if (current.outcome !== "available") {
      return current;
    }

    if (
      input === undefined ||
      parsed === undefined ||
      currentSource === undefined ||
      undoState === undefined
    ) {
      return {
        outcome: "operation-failed",
        detail: "There is no semantic edit to undo.",
      };
    }

    parsed = undoState.parsed;
    currentSource = undoState.source;
    undoState = undefined;

    return {
      outcome: "updated",
      draft: toView(input, parsed, mode, currentSource),
    };
  };

  const setMode = async (
    nextMode: AuthoringMode,
  ): Promise<AuthoringOperationOutcome> => {
    const current = await readDraft();

    if (current.outcome !== "available") {
      return current;
    }

    mode = nextMode;
    return { outcome: "updated", draft: { ...current.draft, mode } };
  };

  return { readDraft, openConstruct, editSemanticText, undoLastEdit, setMode };
};
