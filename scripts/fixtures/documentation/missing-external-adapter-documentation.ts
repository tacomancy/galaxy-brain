/** Sends a record. */
export interface ExternalServiceAdapter {
  send(value: string): Promise<void>;
}
