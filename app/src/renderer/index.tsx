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

  const refreshWorkbench = async (): Promise<void> => {
    // React owns only this presentation projection; the main-process Session
    // remains the authority for repository selection and access.
    setWorkbench(await window.workbench.openFreshWorkbench());
  };

  const createRepository = async (): Promise<void> => {
    const outcome = await window.workbench.createRepository();
    setLastOutcome(outcome);
    await refreshWorkbench();
  };

  const openRepository = async (): Promise<void> => {
    const outcome = await window.workbench.openRepository();
    setLastOutcome(outcome);
    await refreshWorkbench();
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
