import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative, resolve } from "node:path";

const WORKFLOW_ROOTS = [".github/workflows", ".github/actions"];
const EXTERNAL_USE_PATTERN = /^\s*uses:\s*([^\s#]+)(?:\s+#\s*(.*?))?\s*$/;
const IMMUTABLE_REFERENCE_PATTERN = /^[^/\s]+\/[^@\s]+@[0-9a-f]{40}$/;
const VERSION_COMMENT_PATTERN = /\bv\d+(?:\.\d+){0,3}(?:[-+][\w.-]+)?\b/;

function collectYamlFiles(root) {
  const absoluteRoot = resolve(root);
  let entries;

  try {
    entries = readdirSync(absoluteRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return entries.flatMap((entry) => {
    const path = join(absoluteRoot, entry.name);
    if (entry.isDirectory()) {
      return collectYamlFiles(path);
    }
    return /\.(?:yaml|yml)$/.test(entry.name) ? [path] : [];
  });
}

export function findWorkflowSecurityIssues(filePath, content) {
  return content.split(/\r?\n/).flatMap((line, index) => {
    const match = line.match(EXTERNAL_USE_PATTERN);
    if (!match || match[1].startsWith("./")) {
      return [];
    }

    const issues = [];
    if (!IMMUTABLE_REFERENCE_PATTERN.test(match[1])) {
      issues.push(
        `${filePath}:${index + 1}: external action '${match[1]}' must use a full 40-character commit SHA`,
      );
    }
    if (!match[2] || !VERSION_COMMENT_PATTERN.test(match[2])) {
      issues.push(
        `${filePath}:${index + 1}: immutable action '${match[1]}' must retain an inline upstream version comment`,
      );
    }
    return issues;
  });
}

export function findAllWorkflowSecurityIssues(root = process.cwd()) {
  return WORKFLOW_ROOTS.flatMap((workflowRoot) =>
    collectYamlFiles(join(root, workflowRoot)).flatMap((filePath) =>
      findWorkflowSecurityIssues(
        relative(root, filePath),
        readFileSync(filePath, "utf8"),
      ),
    ),
  );
}

if (
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? "")
) {
  const issues = findAllWorkflowSecurityIssues();
  if (issues.length > 0) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      "All external GitHub Actions use immutable commit SHAs with release comments.",
    );
  }
}
