import { useState, type FormEvent, type JSX } from "react";

import type {
  AskPreview,
  ConfirmAskOutcome,
  DiscoveryJumpOutcome,
  DiscoverySearchOutcome,
  PrepareAskOutcome,
} from "../../modules/discovery";

/* eslint-disable sonarjs/cognitive-complexity -- Rationale: this presentation component intentionally renders three explicit modes and their distinct trust-boundary states in one accessible surface. */

type AskStatus =
  | ConfirmAskOutcome
  | { outcome: "unsupported" | "invalid-prompt"; detail: string };

type DiscoveryMode = "search" | "ask" | "jump";

interface DiscoveryProps {
  askOutcome: AskStatus | undefined;
  askPreview: AskPreview | undefined;
  jumpOutcome: DiscoveryJumpOutcome | undefined;
  searchOutcome: DiscoverySearchOutcome | undefined;
  onConfirmAsk: (
    confirmation: "confirmed" | "declined" | "canceled",
  ) => Promise<void>;
  onJump: (command: string) => Promise<void>;
  onOpenSearchResult: (command: string) => Promise<void>;
  onPrepareAsk: (prompt: string) => Promise<void>;
  onRemoveAskContextItem: (itemId: string) => Promise<void>;
  onSearch: (query: string) => Promise<void>;
}

const outcomeText = (
  outcome: AskStatus | DiscoveryJumpOutcome | PrepareAskOutcome,
): string => {
  switch (outcome.outcome) {
    case "declined":
      return "Ask declined; no provider request was made.";
    case "canceled":
      return "Ask canceled; no provider request was made.";
    case "agent-provider-unavailable":
      return outcome.detail;
    case "answered":
      return outcome.answer.text;
    case "resolved":
      return `Jump resolved to ${outcome.target.kind === "workspace" ? outcome.target.workspace : outcome.target.title}.`;
    case "not-found":
      return `Jump target not found: ${outcome.command}`;
    case "invalid-command":
    case "invalid-prompt":
    case "unsupported":
      return outcome.detail;
    case "operation-failed":
      return outcome.detail;
    case "preview-ready":
      return "Ask preview ready.";
    default:
      return "Discovery operation completed.";
  }
};

const statusOutcome = (
  outcome: AskStatus | DiscoveryJumpOutcome | PrepareAskOutcome,
): string => outcome.outcome;

/**
 * Shared, explicit Search/Ask/Jump entry surface for the Workbench shell.
 * @param props Discovery outcomes and operation callbacks supplied by the shell.
 * @returns The accessible Discovery presentation surface.
 */
export const Discovery = ({
  askOutcome,
  askPreview,
  jumpOutcome,
  searchOutcome,
  onConfirmAsk,
  onJump,
  onOpenSearchResult,
  onPrepareAsk,
  onRemoveAskContextItem,
  onSearch,
}: DiscoveryProps): JSX.Element => {
  const [mode, setMode] = useState<DiscoveryMode>("search");
  const [value, setValue] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (mode === "search") {
      await onSearch(value);
    } else if (mode === "ask") {
      await onPrepareAsk(value);
    } else {
      await onJump(value);
    }
  };

  const clearModeSpecificResults = (): void => {
    // Parent-owned outcomes intentionally remain visible until the next
    // operation so that the last caller-visible status is not lost.
  };

  return (
    <section
      id="discovery-surface"
      className="discovery-surface"
      aria-labelledby="discovery-heading"
    >
      <div className="discovery-header">
        <div>
          <span className="card-kicker">Find your way</span>
          <h2 id="discovery-heading">Discovery</h2>
        </div>
        <p className="discovery-trust-note">
          Search retrieves. Ask synthesizes. Jump navigates.
        </p>
      </div>
      <div
        id="discovery-mode-selector"
        className="discovery-mode-selector"
        role="tablist"
        aria-label="Discovery mode"
      >
        {(["search", "ask", "jump"] as const).map((nextMode) => (
          <button
            key={nextMode}
            id={`discovery-mode-${nextMode}`}
            type="button"
            role="tab"
            aria-selected={mode === nextMode}
            onClick={() => {
              setMode(nextMode);
              clearModeSpecificResults();
            }}
          >
            {nextMode.charAt(0).toLocaleUpperCase() + nextMode.slice(1)}
          </button>
        ))}
      </div>
      <form className="discovery-form" onSubmit={(event) => void submit(event)}>
        <label htmlFor="discovery-input">
          {mode === "search"
            ? "Search the selected Knowledge Repository"
            : mode === "ask"
              ? "Ask about the selected Knowledge Repository"
              : "Jump to a known Workbench destination"}
        </label>
        <div className="discovery-input-row">
          <input
            id="discovery-input"
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            placeholder={
              mode === "search"
                ? "Try Bayesian"
                : mode === "ask"
                  ? "What does the repository say?"
                  : "Try Atlas or Paper Desk"
            }
          />
          <button
            id="discovery-submit"
            className="button button-primary"
            type="submit"
          >
            Run {mode.charAt(0).toLocaleUpperCase() + mode.slice(1)}
          </button>
        </div>
      </form>

      {searchOutcome !== undefined ? (
        <div
          id="discovery-search-outcome"
          className="discovery-result"
          role="status"
          data-discovery-outcome={searchOutcome.outcome}
        >
          {searchOutcome.outcome === "found" ? (
            <>
              <h3>Search results for “{searchOutcome.query}”</h3>
              <ol
                id="discovery-search-results"
                className="discovery-result-list"
              >
                {searchOutcome.results.map((result) => (
                  <li
                    key={result.id}
                    id={`discovery-search-result-${result.id}`}
                    data-discovery-authority={result.authority}
                    data-discovery-kind={result.kind}
                  >
                    <div>
                      <strong>{result.title}</strong>
                      <span className="discovery-result-meta">
                        {result.kind} · {result.authority}
                      </span>
                      <p>{result.excerpt}</p>
                    </div>
                    <button
                      className="button button-quiet"
                      type="button"
                      onClick={() => void onOpenSearchResult(result.title)}
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p>
              {searchOutcome.outcome === "no-match"
                ? `No matches for “${searchOutcome.query}”.`
                : searchOutcome.detail}
            </p>
          )}
        </div>
      ) : null}

      {askPreview !== undefined ? (
        <section
          id="discovery-ask-preview"
          className="discovery-result"
          aria-labelledby="discovery-ask-preview-heading"
        >
          <h3 id="discovery-ask-preview-heading">Review Ask before sending</h3>
          <p id="discovery-ask-summary">{askPreview.summary}</p>
          <dl className="discovery-preview-details">
            <div>
              <dt>Destination</dt>
              <dd id="discovery-ask-destination">{askPreview.destination}</dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd id="discovery-ask-model">{askPreview.model}</dd>
            </div>
            <div>
              <dt>Estimated request size</dt>
              <dd>{askPreview.estimatedRequestSize} characters</dd>
            </div>
          </dl>
          <ul id="discovery-ask-context" className="discovery-context-list">
            {askPreview.context.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{item.title}</strong> · {item.authority}
                  {item.source?.locator === undefined
                    ? null
                    : ` · ${item.source.locator}`}
                </span>
                <button
                  id={`discovery-ask-remove-${item.id}`}
                  className="button button-quiet"
                  type="button"
                  onClick={() => void onRemoveAskContextItem(item.id)}
                >
                  Remove context item
                </button>
              </li>
            ))}
          </ul>
          <details>
            <summary>Inspect exact payload</summary>
            <pre id="discovery-ask-payload">
              {JSON.stringify(askPreview.payload, null, 2)}
            </pre>
          </details>
          <div className="action-row">
            <button
              id="discovery-ask-confirm"
              className="button button-primary"
              type="button"
              onClick={() => void onConfirmAsk("confirmed")}
            >
              Confirm and send
            </button>
            <button
              id="discovery-ask-decline"
              className="button button-secondary"
              type="button"
              onClick={() => void onConfirmAsk("declined")}
            >
              Decline
            </button>
            <button
              id="discovery-ask-cancel"
              className="button button-quiet"
              type="button"
              onClick={() => void onConfirmAsk("canceled")}
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {askOutcome !== undefined ? (
        <div
          id="discovery-ask-outcome"
          className="discovery-result"
          role="status"
          data-discovery-outcome={statusOutcome(askOutcome)}
        >
          <p>{outcomeText(askOutcome)}</p>
          {askOutcome.outcome === "answered" ? (
            <>
              <h3>Evidence and limits</h3>
              <ul>
                {askOutcome.answer.citations.map((citation) => (
                  <li key={citation.itemId}>
                    {citation.title} · {citation.authority}
                    {citation.source?.locator === undefined
                      ? null
                      : ` · ${citation.source.locator}`}
                  </li>
                ))}
                {askOutcome.answer.uncertainty.map((item) => (
                  <li key={item}>Uncertainty: {item}</li>
                ))}
                {askOutcome.answer.conflicts.map((item) => (
                  <li key={item}>Conflict: {item}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {jumpOutcome !== undefined ? (
        <div
          id="discovery-jump-outcome"
          className="discovery-result"
          role="status"
          data-discovery-outcome={jumpOutcome.outcome}
        >
          <p>{outcomeText(jumpOutcome)}</p>
        </div>
      ) : null}
    </section>
  );
};

/* eslint-enable sonarjs/cognitive-complexity */
