/** Portable Working Material note owned by the Knowledge Authoring workflow. */
export type WorkingMaterialNote = {
  path: string;
  title: string;
  body: string;
  source: string;
  fingerprint?: string;
  saved: boolean;
};

/** Caller-visible result of a note create, read, or save operation. */
export type WorkingMaterialNoteOutcome =
  | { outcome: "available"; note: WorkingMaterialNote }
  | { outcome: "not-found"; detail: string }
  | { outcome: "invalid"; detail: string }
  | { outcome: "external-change"; detail: string }
  | { outcome: "unavailable"; detail: string };

/** Portable note values and fingerprint expected by a save operation. */
export type WorkingMaterialNoteSaveInput = {
  path: string;
  title: string;
  body: string;
  expectedFingerprint: string | undefined;
};

/** File-backed or in-memory Adapter for portable Working Material notes. */
export interface WorkingMaterialNoteRepository {
  createNote(input: {
    title: string;
    body: string;
    date: string;
  }): Promise<WorkingMaterialNoteOutcome>;
  readNote(path: string): Promise<WorkingMaterialNoteOutcome>;
  saveNote(
    input: WorkingMaterialNoteSaveInput,
  ): Promise<WorkingMaterialNoteOutcome>;
}

/** Public Interface for durable note authoring. */
export interface WorkingMaterialNoteAuthoring {
  createNote(): Promise<WorkingMaterialNoteOutcome>;
  openNote(path: string): Promise<WorkingMaterialNoteOutcome>;
  editNote(input: {
    title: string;
    body: string;
  }): Promise<WorkingMaterialNoteOutcome>;
  readNote(): Promise<WorkingMaterialNoteOutcome>;
}

const invalid = (detail: string): WorkingMaterialNoteOutcome => ({
  outcome: "invalid",
  detail,
});

/**
 * Keeps note editing and autosave policy behind a small application Interface.
 * Every edit is persisted through the supplied Adapter before it is exposed
 * as the current saved note.
 * @param repository The file-backed or test note persistence Adapter.
 * @param date A deterministic date source for note metadata.
 * @returns The durable note authoring Module Interface.
 */
export const createWorkingMaterialNoteAuthoring = (
  repository: WorkingMaterialNoteRepository,
  date: () => string = () => new Date().toISOString().slice(0, 10),
): WorkingMaterialNoteAuthoring => {
  let current: WorkingMaterialNote | undefined;

  const create = async (): Promise<WorkingMaterialNoteOutcome> => {
    current = {
      path: "scratch/untitled-working-material.md",
      title: "Untitled Working Material",
      body: "",
      source: "",
      saved: false,
    };
    return { outcome: "available", note: { ...current } };
  };

  const open = async (path: string): Promise<WorkingMaterialNoteOutcome> => {
    const result = await repository.readNote(path);
    if (result.outcome === "available") current = result.note;
    return result;
  };

  const read = async (): Promise<WorkingMaterialNoteOutcome> => {
    if (current === undefined) {
      return {
        outcome: "not-found",
        detail: "No Working Material note is open.",
      };
    }
    return { outcome: "available", note: { ...current } };
  };

  const edit = async (input: {
    title: string;
    body: string;
  }): Promise<WorkingMaterialNoteOutcome> => {
    if (current === undefined) {
      return {
        outcome: "not-found",
        detail: "No Working Material note is open.",
      };
    }
    const title = input.title.trim();
    if (title.length === 0 || title.includes("\n")) {
      return invalid(
        "A Working Material note title must be one nonempty line.",
      );
    }
    const result = current.saved
      ? await repository.saveNote({
          path: current.path,
          title,
          body: input.body,
          expectedFingerprint: current.fingerprint,
        })
      : await repository.createNote({ title, body: input.body, date: date() });
    if (result.outcome === "available") current = result.note;
    return result;
  };

  return { createNote: create, openNote: open, editNote: edit, readNote: read };
};
