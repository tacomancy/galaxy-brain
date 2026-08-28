/**
 * Reads one external record.
 * @returns The external response.
 */
export const readExternalRecord = (): Promise<Response> => fetch("/record");
