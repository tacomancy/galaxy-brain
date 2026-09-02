import { useState, type JSX } from "react";

import type { RepositoryNavigationEntry } from "../../modules/repository-navigation";

type RepositoryTreeProps = {
  entries: RepositoryNavigationEntry[];
  selectedPath?: string | undefined;
  onOpen: (entry: RepositoryNavigationEntry) => Promise<void>;
};

const childrenFor = (
  entries: RepositoryNavigationEntry[],
  parentPath: string,
): RepositoryNavigationEntry[] =>
  entries.filter((entry) => {
    const parent = entry.path.slice(0, entry.path.lastIndexOf("/"));
    return parent === parentPath;
  });

const RepositoryTreeBranch = ({
  entry,
  entries,
  collapsed,
  onToggle,
  selectedPath,
  onOpen,
}: RepositoryTreeProps & {
  entry: RepositoryNavigationEntry;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
}): JSX.Element => {
  const isDirectory = entry.kind === "directory";
  const isExpanded = !collapsed.has(entry.path);
  const children = isDirectory ? childrenFor(entries, entry.path) : [];

  return (
    <li>
      {isDirectory ? (
        <button
          className="repository-tree-entry repository-tree-directory"
          type="button"
          aria-label={`Expand or collapse ${entry.path}`}
          aria-expanded={isExpanded}
          onClick={() => onToggle(entry.path)}
        >
          <span aria-hidden="true">{isExpanded ? "▾" : "▸"}</span>
          <span>{entry.name}</span>
        </button>
      ) : (
        <button
          className="repository-tree-entry repository-tree-file"
          type="button"
          aria-label={entry.path}
          aria-current={selectedPath === entry.path ? "page" : undefined}
          onClick={() => void onOpen(entry)}
        >
          <span aria-hidden="true">
            {entry.support === "unsupported" ? "·" : "•"}
          </span>
          <span>{entry.name}</span>
        </button>
      )}
      {isDirectory && isExpanded && children.length > 0 ? (
        <ul>
          {children.map((child) => (
            <RepositoryTreeBranch
              key={child.path}
              entry={child}
              entries={entries}
              collapsed={collapsed}
              onToggle={onToggle}
              selectedPath={selectedPath}
              onOpen={onOpen}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

/**
 * Renders the selected repository's sanitized tree as keyboard-operable UI.
 * @param props Repository entries, selected note, and open callback.
 * @returns The repository navigation landmark.
 */
export const RepositoryTree = ({
  entries,
  selectedPath,
  onOpen,
}: RepositoryTreeProps): JSX.Element => {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const roots = entries.filter(
    (entry) => entry.kind === "directory" && !entry.path.includes("/"),
  );

  const toggle = (path: string): void => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <nav
      id="knowledge-repository-tree"
      className="repository-tree"
      aria-label="Knowledge Repository"
    >
      <div className="repository-tree-header">
        <span className="card-kicker">Navigation</span>
        <h2>Knowledge Repository</h2>
      </div>
      <ul>
        {roots.map((entry) => (
          <RepositoryTreeBranch
            key={entry.path}
            entry={entry}
            entries={entries}
            collapsed={collapsed}
            onToggle={toggle}
            selectedPath={selectedPath}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </nav>
  );
};
