import type { SourceAuth } from "./ingestion.types.js";

export class InvalidIngestionSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidIngestionSourceError";
  }
}

export const assertTrustedSourceAuth = (sourceAuth: SourceAuth) => {
  if (!sourceAuth.authenticated) {
    throw new InvalidIngestionSourceError("Ingestion source is not authenticated.");
  }

  if (!sourceAuth.signatureVerified) {
    throw new InvalidIngestionSourceError("Ingestion source signature could not be verified.");
  }
};
