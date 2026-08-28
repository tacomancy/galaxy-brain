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
const tagNames = new Set([
  "param",
  "parameter",
  "returns",
  "return",
  "throws",
  "exception",
]);
const supportedTagNames = new Set([
  ...tagNames,
  "deprecated",
  "author",
  "beta",
  "defaultValue",
  "example",
  "experimental",
  "eventProperty",
  "inheritDoc",
  "internal",
  "license",
  "link",
  "packageDocumentation",
  "public",
  "readonly",
  "remarks",
  "sealed",
  "see",
  "since",
  "template",
  "typeParam",
  "virtual",
]);

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

const normalizedDocumentationLines = (documentation) =>
  documentation
    .split("\n")
    .map((line) => line.replace(/^\s*\* ?/, "").trimEnd());

const hasSubstantiveText = (text) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return (
    normalized.length > 0 &&
    /[A-Za-z]/.test(normalized) &&
    !/^(?:description|todo|tbd|n\/a|none|\.\.\.?|[-_]+)$/i.test(normalized)
  );
};

const parseDocumentation = (documentation) => {
  const lines = normalizedDocumentationLines(documentation);
  const descriptionLines = [];
  const tags = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const tagMatch = line.match(/^@(\S+)(?:\s+(.*))?$/);
    if (!tagMatch) {
      if (tags.length === 0) {
        descriptionLines.push(line);
      } else {
        tags.at(-1).value = `${tags.at(-1).value} ${line}`.trim();
      }
      continue;
    }

    const [, name, value = ""] = tagMatch;
    tags.push({ name, value: value.trim(), line: index });
  }

  const malformed = [];
  for (const tag of tags) {
    if (!supportedTagNames.has(tag.name)) {
      malformed.push(`unsupported or malformed TSDoc tag @${tag.name}`);
      continue;
    }
    if (!tagNames.has(tag.name)) {
      continue;
    }

    if (tag.name === "param" || tag.name === "parameter") {
      const parameterMatch = tag.value.match(
        /^(?:\{[^{}]+\}\s*)?(\S+)(?:\s+([\s\S]*))?$/,
      );
      if (!parameterMatch || !hasSubstantiveText(parameterMatch[2] ?? "")) {
        malformed.push(
          `@${tag.name} must include a parameter name and description`,
        );
      }
      tag.parameterName = parameterMatch?.[1];
      tag.description = parameterMatch?.[2] ?? "";
    } else if (tag.name === "returns" || tag.name === "return") {
      if (!hasSubstantiveText(tag.value)) {
        malformed.push(
          `@${tag.name} must include a return or outcome description`,
        );
      }
      tag.description = tag.value;
    } else if (!hasSubstantiveText(tag.value.replace(/^\{[^{}]+\}\s*/, ""))) {
      malformed.push(`@${tag.name} must include an error description`);
    }
  }

  if (/{@[A-Za-z][^}\n]*(?:\n|$)/.test(documentation)) {
    malformed.push("inline TSDoc tag is not closed");
  }

  return {
    description: descriptionLines.join(" ").trim(),
    parameters: tags.filter(
      (tag) => tag.name === "param" || tag.name === "parameter",
    ),
    returns: tags.filter(
      (tag) => tag.name === "returns" || tag.name === "return",
    ),
    throws: tags.filter(
      (tag) => tag.name === "throws" || tag.name === "exception",
    ),
    malformed,
  };
};

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

  const parsedDocumentation = parseDocumentation(documentation);
  if (!hasSubstantiveText(parsedDocumentation.description)) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        node.getStart(sourceFile),
        `exported API ${displayName ?? "<anonymous>"} must have a substantive description`,
      ),
    );
  }
  parsedDocumentation.malformed.forEach((message) => {
    findings.push(
      finding(
        filePath,
        sourceFile,
        node.getStart(sourceFile),
        `exported API ${displayName ?? "<anonymous>"} has malformed TSDoc: ${message}`,
      ),
    );
  });

  if (
    ts.isInterfaceDeclaration(node) &&
    /Adapter$/.test(displayName ?? "") &&
    !/external|system|seam|boundary|translation|provider/i.test(
      parsedDocumentation.description,
    )
  ) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        node.getStart(sourceFile),
        `external-system seam ${displayName} requires documentation of its boundary or translation constraint`,
      ),
    );
  }

  const functionLike = functionLikeDeclaration(node);
  if (!functionLike) {
    return findings;
  }

  const parameters = functionLike.parameters;
  if (parsedDocumentation.parameters.length < parameters.length) {
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
        parsedDocumentation.parameters[index].parameterName !==
          parameter.name.text
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

  if (parsedDocumentation.returns.length === 0) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        node.getStart(sourceFile),
        `exported API ${displayName ?? "<anonymous>"} must document its return or outcome with @returns`,
      ),
    );
  }

  const hasDirectThrow = (() => {
    let result = false;
    const visit = (candidate) => {
      if (
        candidate !== functionLike &&
        (ts.isFunctionLike(candidate) || ts.isClassLike(candidate))
      ) {
        return;
      }
      if (ts.isThrowStatement(candidate)) {
        result = true;
        return;
      }
      ts.forEachChild(candidate, visit);
    };
    visit(functionLike.body ?? functionLike);
    return result;
  })();
  if (hasDirectThrow && parsedDocumentation.throws.length === 0) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        node.getStart(sourceFile),
        `exported API ${displayName ?? "<anonymous>"} must document its thrown error mode with @throws`,
      ),
    );
  }

  return findings;
};

const commentsIn = (text) =>
  [...text.matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g)]
    .map((match) => match[0])
    .join("\n");

const adjacentComment = (sourceText, position) => {
  const lineStart = sourceText.lastIndexOf("\n", position - 1) + 1;
  const prefixOnLine = sourceText.slice(lineStart, position);
  if (
    /\/\/.*(?:rationale|reason|invariant|safety|boundary|validated|atomic|recover)/i.test(
      prefixOnLine,
    )
  ) {
    return prefixOnLine;
  }

  const preceding = sourceText.slice(0, lineStart).split("\n").slice(0, -1);
  const commentLines = [];
  for (let index = preceding.length - 1; index >= 0; index -= 1) {
    const line = preceding[index].trim();
    if (!line) {
      break;
    }
    if (line.startsWith("//") || line.startsWith("*") || line.endsWith("*/")) {
      commentLines.unshift(line);
      continue;
    }
    break;
  }
  return commentLines.join("\n");
};

const hasRationaleNear = (sourceText, position, pattern = rationaleWords) =>
  pattern.test(
    commentsIn(adjacentComment(sourceText, position)).replace(
      /\/\*\*[\s\S]*?\*\//g,
      "",
    ),
  );

const fileLevelComment = (sourceText) => {
  const leading = sourceText.match(
    /^\s*(\/\*[\s\S]*?\*\/|\/\/[^\n]*)(?=\s*import\b)/,
  );
  return leading?.[1] ?? "";
};

const rationalePatterns = {
  assertion:
    /assert|cast|type|external|schema|validat|boundary|adapter|invariant|conversion|persisted/i,
  any: /any|type|external|schema|validated|boundary|adapter/i,
  lint: /rationale|reason|exception|narrow|intentional|complexity/i,
  filesystem:
    /filesystem|transaction|rollback|atomic|recover|fingerprint|target|path/i,
  ipc: /ipc|preload|bridge|renderer|main|serializable|operation/i,
  external: /external|provider|network|adapter|translation|boundary/i,
};

const hasFileLevelRationale = (sourceText, pattern) =>
  pattern.test(commentsIn(fileLevelComment(sourceText)));

const checkNamedRiskDeclarations = (filePath, sourceFile, sourceText) => {
  const findings = [];
  const declarations = [];
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node)) {
      declarations.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  const risks = [
    ["transaction", /transaction/i],
    ["rollback", /rollback/i],
    ["recovery", /recover/i],
  ];
  for (const [label, namePattern] of risks) {
    for (const declaration of declarations) {
      const name = declaration.name?.getText(sourceFile) ?? "";
      if (!namePattern.test(name)) {
        continue;
      }
      const pattern = /transaction/i.test(label)
        ? /transaction|atomic|fingerprint|recover/i
        : /rollback|recover|invariant|fingerprint|target/i;
      if (
        !hasRationaleNear(
          sourceText,
          declaration.getStart(sourceFile),
          pattern,
        ) &&
        !hasFileLevelRationale(sourceText, pattern)
      ) {
        findings.push(
          finding(
            filePath,
            sourceFile,
            declaration.getStart(sourceFile),
            `${label} code requires an adjacent rationale comment describing its invariant or recovery guarantee`,
          ),
        );
      }
    }
  }
  return findings;
};

const checkRationaleMarkers = (filePath, sourceFile) => {
  const findings = [];
  const sourceText = sourceFile.text;
  const visit = (node) => {
    if (ts.isAsExpression(node)) {
      const assertionType = node.type.getText(sourceFile);
      if (assertionType !== "const" && assertionType !== "unknown") {
        if (
          !hasRationaleNear(
            sourceText,
            node.getStart(sourceFile),
            rationalePatterns.assertion,
          )
        ) {
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
      if (
        !hasRationaleNear(
          sourceText,
          node.getStart(sourceFile),
          rationalePatterns.any,
        )
      ) {
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
    const suppressionExplanation = line.replace(
      /eslint-disable(?:-next-line)?\s+\S+/i,
      "",
    );
    if (
      /eslint-disable/.test(line) &&
      !rationalePatterns.lint.test(suppressionExplanation)
    ) {
      const position = sourceFile.getPositionOfLineAndCharacter(index, 0);
      if (!hasRationaleNear(sourceText, position, rationalePatterns.lint)) {
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
    !hasFileLevelRationale(sourceText, rationalePatterns.filesystem)
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
  if (ipcImport && !hasFileLevelRationale(sourceText, rationalePatterns.ipc)) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        ipcImport.index ?? 0,
        "IPC seam requires a rationale comment describing its safety or translation constraint",
      ),
    );
  }

  const preloadMarker = sourceText.match(/\b(?:contextBridge|ipcRenderer)\b/);
  if (
    preloadMarker &&
    !hasFileLevelRationale(sourceText, rationalePatterns.ipc)
  ) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        preloadMarker.index ?? 0,
        "preload bridge code requires a rationale comment describing its narrow, serializable boundary",
      ),
    );
  }

  const externalMarker = sourceText.match(
    /\b(?:fetch|WebSocket|XMLHttpRequest)\s*\(|\bprocess\.env\b/,
  );
  if (
    externalMarker &&
    !hasRationaleNear(
      sourceText,
      externalMarker.index ?? 0,
      rationalePatterns.external,
    ) &&
    !hasFileLevelRationale(sourceText, rationalePatterns.external)
  ) {
    findings.push(
      finding(
        filePath,
        sourceFile,
        externalMarker.index ?? 0,
        "external-system seam requires an adjacent rationale comment describing its adapter or translation constraint",
      ),
    );
  }

  findings.push(
    ...checkNamedRiskDeclarations(filePath, sourceFile, sourceText),
  );

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
