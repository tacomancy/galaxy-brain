import type { FreshWorkbench } from "../../modules/workbench-session";
import type { JSX } from "react";

interface AtlasProps {
  workbench: FreshWorkbench;
}

export const Atlas = ({ workbench }: AtlasProps): JSX.Element => {
  if (workbench.activeWorkspace !== "atlas") {
    throw new Error("A fresh Workbench must open Atlas.");
  }

  return (
    <main aria-labelledby="atlas-heading">
      <h1 id="atlas-heading">Atlas</h1>
      {workbench.repositoryStatus === "not-selected" ? (
        <section id="atlas-empty-state" aria-labelledby="atlas-empty-heading">
          <h2 id="atlas-empty-heading">No Knowledge Repository is open.</h2>
          <p>Open or create one to begin.</p>
        </section>
      ) : null}
    </main>
  );
};
