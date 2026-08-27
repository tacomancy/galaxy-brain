import type { FreshWorkbench } from "../../modules/workbench-session";
import type { JSX } from "react";

/** Props supplied by the Workbench Session through the renderer entry point. */
interface AtlasProps {
  workbench: FreshWorkbench;
}

/**
 * Atlas is the fresh-session orientation workspace.
 *
 * It renders the empty state from domain state rather than querying a
 * repository or inventing demonstration content in the UI Adapter.
 */
export const Atlas = ({ workbench }: AtlasProps): JSX.Element => {
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
        </section>
      ) : null}
    </main>
  );
};
