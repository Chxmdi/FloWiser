export type RollupGranularity = "1m" | "5m" | "1h" | "1d";

export const getBucketStart = (timestamp: string, granularity: RollupGranularity) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid timestamp supplied for rollup bucket calculation.");
  }

  if (granularity === "1d") {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
  }

  if (granularity === "1h") {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours())
    ).toISOString();
  }

  const minuteBucket = granularity === "5m" ? Math.floor(date.getUTCMinutes() / 5) * 5 : date.getUTCMinutes();

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      minuteBucket
    )
  ).toISOString();
};
