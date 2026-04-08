import type { GatewayAgent } from "./gateway.types.js";

export const defaultGatewayAgents: GatewayAgent[] = [
  {
    agentId: "gateway-agent-lagos-hq",
    tenantId: "tenant-1",
    branchId: "branch-1",
    siteId: "lagos-hq",
    deviceId: undefined,
    displayName: "Lagos HQ Gateway Agent",
    sharedKey: "flowiser-gateway-key-lagos-hq",
    supportedActionTypes: ["schedule_adjustment", "schedule_tuning", "connectivity_check"],
    isActive: true
  },
  {
    agentId: "gateway-agent-abuja-central",
    tenantId: "tenant-1",
    branchId: "branch-1",
    siteId: "abuja-central",
    deviceId: undefined,
    displayName: "Abuja Central Gateway Agent",
    sharedKey: "flowiser-gateway-key-abuja-central",
    supportedActionTypes: ["schedule_adjustment", "schedule_tuning", "connectivity_check"],
    isActive: true
  }
];
