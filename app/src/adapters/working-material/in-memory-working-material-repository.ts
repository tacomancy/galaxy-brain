import type {
  StructuredAnnotation,
  WorkingMaterialRepository,
} from "../../modules/source-processing";

const copyAnnotation = (
  annotation: StructuredAnnotation,
): StructuredAnnotation => ({
  ...annotation,
  sourceRecord: { ...annotation.sourceRecord },
  sourceLocator: { ...annotation.sourceLocator },
});

/** In-memory Working Material Adapter used by the S3 behavior test. */
export const createInMemoryWorkingMaterialRepository =
  (): WorkingMaterialRepository => {
    const annotations = new Map<string, StructuredAnnotation>();

    return {
      saveAnnotation: async (annotation): Promise<void> => {
        annotations.set(annotation.id, copyAnnotation(annotation));
      },
      readAnnotation: async (annotationId) => {
        const annotation = annotations.get(annotationId);
        return annotation === undefined
          ? {
              outcome: "not-found" as const,
              detail: "The source annotation was not found.",
            }
          : {
              outcome: "found" as const,
              annotation: copyAnnotation(annotation),
            };
      },
      readAnnotationForSourceRecord: async (sourceRecordId) => {
        const annotation = [...annotations.values()].find(
          (candidate) => candidate.sourceRecord.id === sourceRecordId,
        );

        return annotation === undefined
          ? {
              outcome: "not-found" as const,
              detail: "The source annotation was not found.",
            }
          : {
              outcome: "found" as const,
              annotation: copyAnnotation(annotation),
            };
      },
      readAnnotationsForSourceRecord: async (sourceRecordId) => {
        const matching = [...annotations.values()]
          .filter((candidate) => candidate.sourceRecord.id === sourceRecordId)
          .map(copyAnnotation);

        return matching.length === 0
          ? {
              outcome: "not-found" as const,
              detail: "The source annotation was not found.",
            }
          : { outcome: "found" as const, annotations: matching };
      },
    };
  };
