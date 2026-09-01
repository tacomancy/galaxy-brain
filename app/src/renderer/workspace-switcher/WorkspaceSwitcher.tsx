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

interface WorkspaceNavigationProps extends WorkspaceSwitcherProps {
  id: string;
  buttonIdPrefix: string;
}

const WorkspaceNavigation = ({
  id,
  buttonIdPrefix,
  activeWorkspace,
  hasContext,
  onSwitchWorkspace,
}: WorkspaceNavigationProps): JSX.Element => {
  const contextHelpId = `${id}-context-help`;

  return (
    <>
      <nav id={id} aria-label="Workspaces">
        {workspaces.map(({ label, workspace }) => (
          <button
            key={workspace}
            id={`${buttonIdPrefix}-${workspace}`}
            type="button"
            aria-current={activeWorkspace === workspace ? "page" : undefined}
            aria-describedby={
              workspace !== "atlas" && !hasContext ? contextHelpId : undefined
            }
            disabled={workspace !== "atlas" && !hasContext}
            onClick={() => onSwitchWorkspace(workspace)}
          >
            {label}
          </button>
        ))}
      </nav>
      {!hasContext ? (
        <p id={contextHelpId} className="side-navigation-context-help">
          Select a topic to enable Studio
          <br />
          Open a Source Record to enable Paper Desk
        </p>
      ) : null}
    </>
  );
};

/**
 * A compact, context-preserving switcher shared by the three workspaces.
 * @param props The active workspace, context state, and transition callback.
 * @returns The workspace navigation element.
 */
export const WorkspaceSwitcher = ({
  activeWorkspace,
  hasContext,
  onSwitchWorkspace,
}: WorkspaceSwitcherProps): JSX.Element => (
  <WorkspaceNavigation
    id="workspace-switcher"
    buttonIdPrefix="workspace-switcher"
    activeWorkspace={activeWorkspace}
    hasContext={hasContext}
    onSwitchWorkspace={onSwitchWorkspace}
  />
);

/**
 * Functional side navigation over the existing Workbench transitions.
 * @param props The active workspace, context state, and transition callback.
 * @returns The workspace side navigation element.
 */
export const WorkspaceSideNavigation = ({
  activeWorkspace,
  hasContext,
  onSwitchWorkspace,
}: WorkspaceSwitcherProps): JSX.Element => (
  <WorkspaceNavigation
    id="workspace-side-navigation"
    buttonIdPrefix="side-nav"
    activeWorkspace={activeWorkspace}
    hasContext={hasContext}
    onSwitchWorkspace={onSwitchWorkspace}
  />
);
