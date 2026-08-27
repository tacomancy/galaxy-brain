/** Renderer entry point for the desktop Workbench shell. */
import { createRoot } from "react-dom/client";

import { Atlas } from "./atlas/Atlas";

const rootElement = document.getElementById("root");

// A missing mount point means the packaged document and renderer are out of
// sync; do not silently drop the Workbench UI in that case.
if (rootElement === null) {
  throw new Error("Workbench root is unavailable.");
}

const root = createRoot(rootElement);

// Request session state through the typed preload bridge, then render the
// workspace selected by the application Module.
void window.workbench.openFreshWorkbench().then((workbench) => {
  root.render(<Atlas workbench={workbench} />);
});
