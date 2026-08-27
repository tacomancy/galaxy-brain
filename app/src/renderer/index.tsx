import { createRoot } from "react-dom/client";

import { Atlas } from "./atlas/Atlas";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Workbench root is unavailable.");
}

const root = createRoot(rootElement);

void window.workbench.openFreshWorkbench().then((workbench) => {
  root.render(<Atlas workbench={workbench} />);
});
