import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("../app/node_modules/typescript");

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const productionSourceRoot = join(repositoryRoot, "app", "src");
const sourceExtensions = new Set([".ts", ".tsx"]);
const exportedDeclarationKinds = new Set([
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.EnumDeclaration,
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.TypeAliasDeclaration,
  ts.SyntaxKind.VariableStatement,
]);
const rationaleWords =
  /rationale|reason|invariant|safety|trade[- ]off|boundary|validated|atomic|recover/i;

const formatPath = (filePath) => relative(repositoryRoot, filePath);

const lineNumberFor = (sourceFile, position) =>
  sourceFile.getLineAndCharacterOfPosition(position).line + 1;

const finding = (filePath, sourceFile, position, message) =>
  `${formatPath(filePath)}:${lineNumberFor(sourceFile, position)}: ${message}`;

const leadingDocumentation = (sourceFile, node) => {
  const leading = sourceFile.text.slice(
    node.getFullStart(),
    node.getStart(sourceFile),
  );
  if (!leading.trimEnd().endsWith("*/")) {
    return "";
  }

  const matches = [...leading.matchAll(/\/\*\*([\s\S]*?)\*\//g)];
  return matches.at(-1)?.[1] ?? "";
};

const documentationTags = (documentation) => ({
  parameters: [...documentation.matchAll(/@param(?:eter)?\s+([^\s-]+)/g)].map(
    (match) => match[1],
  ),
  returns: /@returns?\b/.test(documentation),
});

const isExported = (node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  );

const functionLikeInitializer = (declaration) => {
  if (!declaration.initializer) {
    return undefined;
  }

  return ts.isArrowFunction(declaration.initializer) ||
    ts.isFunctionExpression(declaration.initializer)
    ? declaration.initializer
    : undefined;
};

const functionLikeDeclaration = (node) => {
  if (ts.isFunctionDeclaration(node)) {
    return node;
  }

  if (
    ts.isVariableStatement(node) &&
    node.declarationList.declarations.length === 1
  ) {
    return functionLikeInitializer(node.declarationList.declarations[0]);
  }

  return undefined;
};

const checkPublicDocumentation = (filePath, sourceFile, node) => {
  if (!exportedDeclarationKinds.has(node.kind) || !isExported(node)) {
    return [];
  }

  const documentation = leadingDocumentation(sourceFile, node);
  const displayName = ts.isVariableStatement(node)
    ? node.declarationList.declarations[0]?.name.getText(sourceFile)
    : node.name?.getText(sourceFile);
  const findings = [];

  if (!documentation.trim()) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        node.getStart(sourceFile),
        `exported API ${displayName ?? "<anonymous>"} is missing documentation`,
      ),
    );
    return findings;
  }

  const functionLike = functionLikeDeclaration(node);
  if (!functionLike) {
    return findings;
  }

  const tags = documentationTags(documentation);
  const parameters = functionLike.parameters;
  if (tags.parameters.length < parameters.length) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        node.getStart(sourceFile),
        `exported API ${displayName ?? "<anonymous>"} must document each parameter with @param`,
      ),
    );
  } else {
    parameters.forEach((parameter, index) => {
      if (
        ts.isIdentifier(parameter.name) &&
        tags.parameters[index] !== parameter.name.text
      ) {
        findings.push(
          finding(
            filePath,
            sourceFile,
            parameter.getStart(sourceFile),
            `exported API ${displayName ?? "<anonymous>"} must document parameter ${parameter.name.text} with @param`,
          ),
        );
      }
    });
  }

  if (!tags.returns) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        node.getStart(sourceFile),
        `exported API ${displayName ?? "<anonymous>"} must document its return or outcome with @returns`,
      ),
    );
  }

  return findings;
};

const commentsIn = (text) =>
  [...text.matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g)]
    .map((match) => match[0])
    .join("\n");

const hasRationaleNear = (sourceText, position) => {
  const lineStart = sourceText.lastIndexOf("\n", position - 1) + 1;
  const nearby = sourceText.slice(Math.max(0, lineStart - 600), position);
  return rationaleWords.test(commentsIn(nearby));
};

const checkRationaleMarkers = (filePath, sourceFile) => {
  const findings = [];
  const sourceText = sourceFile.text;
  const comments = commentsIn(sourceText);

  const visit = (node) => {
    if (ts.isAsExpression(node)) {
      const assertionType = node.type.getText(sourceFile);
      if (assertionType !== "const" && assertionType !== "unknown") {
        if (!hasRationaleNear(sourceText, node.getStart(sourceFile))) {
          findings.push(
            finding(
              filePath,
              sourceFile,
              node.getStart(sourceFile),
              "unsafe type assertion requires an adjacent rationale comment",
            ),
          );
        }
      }
    }

    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      if (!hasRationaleNear(sourceText, node.getStart(sourceFile))) {
        findings.push(
          finding(
            filePath,
            sourceFile,
            node.getStart(sourceFile),
            "any type escape requires an adjacent rationale comment",
          ),
        );
      }
    }

    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  sourceText.split("\n").forEach((line, index) => {
    if (/eslint-disable/.test(line) && !rationaleWords.test(line)) {
      const nearby = sourceText
        .split("\n")
        .slice(Math.max(0, index - 2), index + 1)
        .join("\n");
      if (!rationaleWords.test(commentsIn(nearby))) {
        findings.push(
          finding(
            filePath,
            sourceFile,
            sourceFile.getPositionOfLineAndCharacter(index, 0),
            "eslint-disable requires a rationale comment",
          ),
        );
      }
    }

    if (/(TODO|FIXME)\b/.test(line) && !/(#\d+|owner\s*[:=])/i.test(line)) {
      findings.push(
        finding(
          filePath,
          sourceFile,
          sourceFile.getPositionOfLineAndCharacter(index, 0),
          "TODO/FIXME must name an owner or follow-up issue",
        ),
      );
    }
  });

  const filesystemImport = sourceText.match(
    /from\s+["']node:fs(?:\/promises)?["']/,
  );
  if (
    filesystemImport &&
    !/filesystem|transaction|rollback|atomic|recover/i.test(
      commentsIn(sourceText.slice(0, filesystemImport.index)),
    )
  ) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        filesystemImport.index ?? 0,
        "filesystem seam requires a rationale comment describing its safety or transaction invariant",
      ),
    );
  }

  const ipcImport = sourceText.match(/from\s+["']electron["']/);
  if (
    ipcImport &&
    !/\bipc\b/i.test(commentsIn(sourceText.slice(0, ipcImport.index)))
  ) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        ipcImport.index ?? 0,
        "IPC seam requires a rationale comment describing its safety or translation constraint",
      ),
    );
  }

  return findings;
};

const checkFile = async (filePath) => {
  const sourceText = await readFile(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    extname(filePath) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const findings = [];

  const visit = (node) => {
    findings.push(...checkPublicDocumentation(filePath, sourceFile, node));
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  findings.push(...checkRationaleMarkers(filePath, sourceFile));
  return findings;
};

const collectSourceFiles = async (directory) => {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)));
    } else if (
      sourceExtensions.has(extname(entry.name)) &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(entryPath);
    }
  }

  return files;
};

const inputFiles = process.argv.slice(2).map((filePath) => resolve(filePath));
const files = inputFiles.length
  ? inputFiles
  : await collectSourceFiles(productionSourceRoot);
const findings = (
  await Promise.all(files.map((filePath) => checkFile(filePath)))
).flat();

if (findings.length > 0) {
  process.stderr.write(`${findings.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Documentation checks passed for ${files.length} file(s).\n`,
  );
}
