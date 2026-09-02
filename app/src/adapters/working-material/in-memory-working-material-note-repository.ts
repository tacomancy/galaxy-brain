import { createHash } from "node:crypto";

import {
  type WorkingMaterialNote,
  type WorkingMaterialNoteOutcome,
  type WorkingMaterialNoteRepository,
} from "../../modules/working-material-authoring";

const sourceFor = (title: string, body: string, date: string): string =>
  `---\ntitle: ${title}\ntype: scratch\nstatus: active\ncreated: ${date}\nreviewed: ${date}\ntags: []\ncandidate_tags: []\naliases: []\n---\n\n# ${title}\n\n${body}\n`;

const fingerprintFor = (source: string): string =>
  createHash("sha256").update(source).digest("hex");

/**
 * Creates an in-memory note Adapter for authoring behavior tests.
 * @returns A deterministic repository that stores notes for the test lifetime.
 */
export const createInMemoryWorkingMaterialNoteRepository =
  (): WorkingMaterialNoteRepository => {
    const notes = new Map<string, WorkingMaterialNote>();
    return {
      createNote: async ({
        title,
        body,
        date,
      }): Promise<WorkingMaterialNoteOutcome> => {
        const path = `scratch/tb17-${title.toLowerCase().replace(/[^a-z0-9]+/gu, "-")}.md`;
        const source = sourceFor(title, body, date);
        const note = {
          path,
          title,
          body,
          source,
          fingerprint: fingerprintFor(source),
          saved: true,
        };
        notes.set(path, note);
        return { outcome: "available", note };
      },
      readNote: async (path): Promise<WorkingMaterialNoteOutcome> => {
        const note = notes.get(path);
        return note === undefined
          ? {
              outcome: "not-found",
              detail: "The Working Material note was not found.",
            }
          : { outcome: "available", note: { ...note } };
      },
      saveNote: async ({
        path,
        title,
        body,
      }): Promise<WorkingMaterialNoteOutcome> => {
        const prior = notes.get(path);
        if (prior === undefined)
          return {
            outcome: "not-found",
            detail: "The Working Material note was not found.",
          };
        const source = sourceFor(title, body, "2026-09-01");
        const note = {
          ...prior,
          title,
          body,
          source,
          fingerprint: fingerprintFor(source),
          saved: true,
        };
        notes.set(path, note);
        return { outcome: "available", note };
      },
    };
  };
