export type IdempotencyRecord = {
  key: string;
  kind: "transport" | "canonical";
  createdAt: string;
};

export interface IdempotencyRepository {
  find(key: string): IdempotencyRecord | undefined;
  save(record: IdempotencyRecord): IdempotencyRecord;
}
