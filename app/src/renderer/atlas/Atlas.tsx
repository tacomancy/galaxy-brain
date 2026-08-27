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
      {/* Keep the first empty state explicit and accessible until repository
          open/create actions are introduced by the next tracer bullet. */}
      {workbench.repositoryStatus === "not-selected" ? (
        <section id="atlas-empty-state" aria-labelledby="atlas-empty-heading">
          <h2 id="atlas-empty-heading">No Knowledge Repository is open.</h2>
          <p>Open or create one to begin.</p>
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
            {lastOutcome?.outcome === "opened"
              ? "Knowledge Repository opened and selected."
              : "Knowledge Repository created and selected."}
          </h2>
          <p id="repository-location">{workbench.repositoryPath}</p>
        </section>
      )}
      {lastOutcome !== undefined && "detail" in lastOutcome ? (
        <p id="repository-error" role="alert">
          {lastOutcome.detail}
        </p>
      ) : null}
    </main>
  );
};
