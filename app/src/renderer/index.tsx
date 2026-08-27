/** Renderer entry point for the desktop Workbench shell. */
import { createRoot } from "react-dom/client";
import { useState } from "react";

import { Atlas } from "./atlas/Atlas";
import type {
  FreshWorkbench,
  RepositoryOperationOutcome,
} from "../modules/workbench-session";

const rootElement = document.getElementById("root");

// A missing mount point means the packaged document and renderer are out of
// sync; do not silently drop the Workbench UI in that case.
if (rootElement === null) {
  throw new Error("Workbench root is unavailable.");
}

const root = createRoot(rootElement);

// Request session state through the typed preload bridge, then render the
// workspace selected by the application Module.
const WorkbenchShell = ({
  initialWorkbench,
}: {
  initialWorkbench: FreshWorkbench;
}) => {
  const [workbench, setWorkbench] = useState(initialWorkbench);
  const [lastOutcome, setLastOutcome] = useState<RepositoryOperationOutcome>();

  const selectRepository = (
    outcome:
      | Extract<
          RepositoryOperationOutcome,
          {
            outcome: "created" | "opened" | "read-only-compatible";
          }
        >
      | undefined,
  ): void => {
    if (outcome === undefined) {
      return;
    }

    setWorkbench({
      activeWorkspace: "atlas",
      repositoryStatus: "selected",
      repositoryPath: outcome.repositoryPath,
      repositoryAccess:
        outcome.outcome === "read-only-compatible" ? "read-only" : "read-write",
      repositorySelection: outcome.outcome,
    });
  };

  const createRepository = async (): Promise<void> => {
    const outcome = await window.workbench.createRepository();
    setLastOutcome(outcome);

    selectRepository(outcome.outcome === "created" ? outcome : undefined);
  };

  const openRepository = async (): Promise<void> => {
    const outcome = await window.workbench.openRepository();
    setLastOutcome(outcome);

    selectRepository(
      outcome.outcome === "opened" || outcome.outcome === "read-only-compatible"
        ? outcome
        : undefined,
    );
  };

  return (
    <Atlas
      workbench={workbench}
      lastOutcome={lastOutcome}
      onCreateRepository={createRepository}
      onOpenRepository={openRepository}
    />
  );
};

void window.workbench.openFreshWorkbench().then((workbench) => {
  root.render(<WorkbenchShell initialWorkbench={workbench} />);
});
