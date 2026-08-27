import type {
  FreshWorkbench,
  RepositoryOperationOutcome,
} from "../../modules/workbench-session";
import type { JSX } from "react";

/** Props supplied by the Workbench Session through the renderer entry point. */
interface AtlasProps {
  workbench: FreshWorkbench;
  lastOutcome: RepositoryOperationOutcome | undefined;
  onCreateRepository: () => Promise<void>;
  onOpenRepository: () => Promise<void>;
}

/**
 * Atlas is the fresh-session orientation workspace.
 *
 * It renders the empty state from domain state rather than querying a
 * repository or inventing demonstration content in the UI Adapter.
 */
export const Atlas = ({
  workbench,
  lastOutcome,
  onCreateRepository,
  onOpenRepository,
}: AtlasProps): JSX.Element => {
  // This is an invariant of the fresh-session Interface. Failing loudly keeps
  // a mismatched composition from looking like a valid Atlas screen.
  if (workbench.activeWorkspace !== "atlas") {
    throw new Error("A fresh Workbench must open Atlas.");
  }

  return (
    <main aria-labelledby="atlas-heading">
      <h1 id="atlas-heading">Atlas</h1>
      {/* Keep the empty state explicit and accessible while the user chooses a
          repository. */}
      {workbench.repositoryStatus === "not-selected" ? (
        <section id="atlas-empty-state" aria-labelledby="atlas-empty-heading">
          <h2 id="atlas-empty-heading">No Knowledge Repository is open.</h2>
          <p>
            {lastOutcome === undefined
              ? "Open or create one to begin."
              : "Choose Open or Create to recover this Workbench session."}
          </p>
          <button id="open-repository" type="button" onClick={onOpenRepository}>
            Open a Knowledge Repository
          </button>
          <button
            id="create-repository"
            type="button"
            onClick={onCreateRepository}
          >
            Create a Knowledge Repository
          </button>
        </section>
      ) : (
        <section
          id="repository-status"
          aria-labelledby="repository-status-heading"
        >
          <h2 id="repository-status-heading">
            {workbench.repositorySelection === "opened"
              ? "Knowledge Repository opened and selected."
              : workbench.repositorySelection === "read-only-compatible"
                ? "Knowledge Repository opened read-only."
                : "Knowledge Repository created and selected."}
          </h2>
          <p id="repository-location">{workbench.repositoryPath}</p>
          {workbench.repositoryAccess === "read-only" ? (
            <p id="repository-access">
              Read-only: this repository uses a newer format version.
            </p>
          ) : null}
          <button id="open-repository" type="button" onClick={onOpenRepository}>
            Open another Knowledge Repository
          </button>
          <button
            id="create-repository"
            type="button"
            onClick={onCreateRepository}
          >
            Create another Knowledge Repository
          </button>
        </section>
      )}
      {/* Stable outcome is exposed separately from explanatory copy for S1. */}
      {lastOutcome !== undefined && "detail" in lastOutcome ? (
        <p
          id="repository-error"
          role="alert"
          data-workbench-outcome={lastOutcome.outcome}
        >
          {lastOutcome.detail}
        </p>
      ) : null}
    </main>
  );
};
