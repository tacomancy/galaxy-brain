import type { JSX } from "react";

import type { WorkbenchWorkspace } from "../../modules/workbench-session";

interface WorkspaceSwitcherProps {
  activeWorkspace: WorkbenchWorkspace;
  hasContext: boolean;
  onSwitchWorkspace: (workspace: WorkbenchWorkspace) => Promise<void>;
}

const workspaces: ReadonlyArray<{
  id: string;
  label: string;
  workspace: WorkbenchWorkspace;
}> = [
  { id: "workspace-switcher-atlas", label: "Atlas", workspace: "atlas" },
  {
    id: "workspace-switcher-studio",
    label: "Studio",
    workspace: "studio",
  },
  {
    id: "workspace-switcher-paper-desk",
    label: "Paper Desk",
    workspace: "paper-desk",
  },
];

/** A compact, context-preserving switcher shared by the three workspaces. */
export const WorkspaceSwitcher = ({
  activeWorkspace,
  hasContext,
  onSwitchWorkspace,
}: WorkspaceSwitcherProps): JSX.Element => (
  <nav id="workspace-switcher" aria-label="Workspaces">
    {workspaces.map(({ id, label, workspace }) => (
      <button
        key={workspace}
        id={id}
        type="button"
        aria-current={activeWorkspace === workspace ? "page" : undefined}
        disabled={workspace !== "atlas" && !hasContext}
        onClick={() => onSwitchWorkspace(workspace)}
      >
        {label}
      </button>
    ))}
  </nav>
);
