const round = (value: number, precision = 4) => Number(value.toFixed(precision));

export const toNumber = (value: number | string, fieldName: string) => {
  const normalized = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(normalized)) {
    throw new Error(`Invalid numeric value for ${fieldName}`);
  }

  return normalized;
};

export const wattsToKw = (value: number | string) => round(toNumber(value, "watts") / 1000);
export const whToKwh = (value: number | string) => round(toNumber(value, "watt_hours") / 1000);
export const identity = (value: number | string, fieldName: string) => round(toNumber(value, fieldName));
