import type { CanonicalMetricKey } from "@flowiser/schemas";

export const satecMetricCodeMap: Record<string, CanonicalMetricKey> = {
  P_TOTAL_W: "kw",
  E_IMPORT_WH_TOTAL: "kwhTotal",
  V_L1: "voltageL1",
  V_L2: "voltageL2",
  V_L3: "voltageL3",
  I_L1: "currentL1",
  I_L2: "currentL2",
  I_L3: "currentL3",
  FREQ_HZ: "frequency",
  PF_TOTAL: "powerFactor"
};

export const mapSatecMetricCode = (code: string) => satecMetricCodeMap[code];
