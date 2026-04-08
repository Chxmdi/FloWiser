import type { InfraProfile } from "./telemetry-infra.types.js";

export const defaultInfraProfiles: InfraProfile[] = [
  {
    profileId: "mqtt-primary",
    profileType: "broker",
    displayName: "Primary MQTT broker",
    connectionMode: "external_managed",
    config: { protocol: "mqtt", host: "mqtt.flowiser.local", port: 8883, topicPrefix: "flowiser/gateway" },
    healthStatus: "unknown",
    enabled: true
  },
  {
    profileId: "kafka-outbox",
    profileType: "broker",
    displayName: "Kafka outbox bridge",
    connectionMode: "external_managed",
    config: { protocol: "kafka", bootstrapServers: ["kafka.flowiser.local:9092"], topic: "gateway.dispatch.commands" },
    healthStatus: "unknown",
    enabled: true
  },
  {
    profileId: "otel-collector",
    profileType: "telemetry",
    displayName: "OpenTelemetry collector",
    connectionMode: "external_managed",
    config: { protocol: "otlp-http", endpoint: "https://otel.flowiser.local/v1" },
    healthStatus: "unknown",
    enabled: true
  },
  {
    profileId: "logs-loki",
    profileType: "logging",
    displayName: "Central log sink",
    connectionMode: "external_managed",
    config: { protocol: "loki", endpoint: "https://logs.flowiser.local/api/v1/push" },
    healthStatus: "unknown",
    enabled: true
  },
  {
    profileId: "metrics-remote-write",
    profileType: "metrics",
    displayName: "Prometheus remote write",
    connectionMode: "external_managed",
    config: { protocol: "prometheus-remote-write", endpoint: "https://metrics.flowiser.local/api/v1/write" },
    healthStatus: "unknown",
    enabled: true
  },
  {
    profileId: "traces-tempo",
    profileType: "tracing",
    displayName: "Tempo trace backend",
    connectionMode: "external_managed",
    config: { protocol: "otlp-grpc", endpoint: "tempo.flowiser.local:4317" },
    healthStatus: "unknown",
    enabled: true
  }
];
