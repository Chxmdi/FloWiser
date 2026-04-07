export const normalizeTimestampToUtc = (input: string | number | Date) => {
  const value =
    typeof input === "number"
      ? new Date(input)
      : input instanceof Date
        ? input
        : new Date(input);

  if (Number.isNaN(value.getTime())) {
    throw new Error("Invalid timestamp supplied for telemetry payload");
  }

  return value.toISOString();
};

export const resolveReceivedAt = (receivedAt?: string) =>
  receivedAt ? normalizeTimestampToUtc(receivedAt) : new Date().toISOString();
