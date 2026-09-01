import { execFile } from "node:child_process";
import { promisify } from "node:util";

/** Operation-specific Git seam used to read a base-to-head path list. */
export type GitDiffRunner = (baseRef: string) => Promise<string>;

const execFileAsync = promisify(execFile);

const runGitDiff: GitDiffRunner = async (baseRef) => {
  const { stdout } = await execFileAsync(
    "git",
    ["diff", "--name-only", `${baseRef}...HEAD`],
    { encoding: "utf8" },
  );
  return stdout;
};

/**
 * Reads repository paths changed from a base revision through the Git
 * external-system seam. The default runner uses Git; tests may provide a
 * narrow operation-specific runner without reproducing Git behavior.
 */
export const readChangedFiles = async (
  baseRef: string,
  runDiff: GitDiffRunner = runGitDiff,
): Promise<string[]> =>
  (await runDiff(baseRef))
    .split("\n")
    .map((file) => file.trim())
    .filter((file) => file.length > 0);
