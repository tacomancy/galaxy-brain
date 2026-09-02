/** A repository-relative entry exposed by the Knowledge Repository navigator. */
export type RepositoryNavigationEntry = {
  path: string;
  name: string;
  kind: "directory" | "file";
  support:
    | "directory"
    | "topic"
    | "source-record"
    | "structured-annotation"
    | "saved-synthesis-result"
    | "working-material"
    | "unsupported";
  title?: string;
  identity?: string;
};

/** Caller-visible result of reading the safe repository tree. */
export type RepositoryNavigationReadOutcome =
  | { outcome: "available"; entries: RepositoryNavigationEntry[] }
  | { outcome: "unavailable"; detail: string };

/** Caller-visible target resolved from one repository-relative entry. */
export type RepositoryNavigationTarget =
  | {
      outcome: "topic";
      path: string;
      identity: string;
      title: string;
    }
  | {
      outcome: "source-record";
      path: string;
      identity: string;
      title: string;
    }
  | {
      outcome: "structured-annotation";
      path: string;
      identity: string;
      title: string;
    }
  | {
      outcome: "saved-synthesis-result";
      path: string;
      identity: string;
      title: string;
    }
  | {
      outcome: "working-material";
      path: string;
      title: string;
    }
  | {
      outcome: "unsupported";
      path: string;
      detail: string;
    };

/** Caller-visible result of opening one repository-relative entry. */
export type RepositoryNavigationOpenOutcome =
  RepositoryNavigationTarget | { outcome: "unavailable"; detail: string };

/** Adapter that supplies a safe repository-relative navigation projection. */
export interface RepositoryNavigationSource {
  readEntries(): Promise<RepositoryNavigationReadOutcome>;
  openEntry(path: string): Promise<RepositoryNavigationOpenOutcome>;
}

/** Module Interface used by the renderer and tests for repository navigation. */
export interface RepositoryNavigation {
  readTree(): Promise<RepositoryNavigationReadOutcome>;
  open(path: string): Promise<RepositoryNavigationOpenOutcome>;
}

/**
 * Keeps repository navigation policy behind a small caller-facing Interface.
 * The source owns filesystem safety and file interpretation; this Module
 * rejects malformed navigation requests and preserves typed outcomes.
 * @param source The Adapter that reads and resolves the selected repository.
 * @returns The repository navigation Module Interface.
 */
export const createRepositoryNavigation = (
  source: RepositoryNavigationSource,
): RepositoryNavigation => ({
  readTree: () => source.readEntries(),
  open: async (path) => {
    if (
      path.length === 0 ||
      path.startsWith("/") ||
      path.includes("..") ||
      path.includes("\\")
    ) {
      return {
        outcome: "unavailable",
        detail: "The repository navigation target is invalid.",
      };
    }

    return source.openEntry(path);
  },
});
