import express from "express";
import { healthRouter } from "./routes/health.js";
import { rawEventsRouter } from "./routes/raw-events.js";
import { telemetryRouter } from "./routes/telemetry.js";
import { ingestionRouter } from "./routes/ingestion.js";
import { registryRouter } from "./routes/registry.js";
import { qualityRouter } from "./routes/quality.js";
import { stateRouter } from "./routes/state.js";
import { alertsRouter } from "./routes/alerts.js";
import { issuesRouter } from "./routes/issues.js";
import { fieldRouter } from "./routes/field.js";
import { rulesRouter } from "./routes/rules.js";
import { recommendationsRouter } from "./routes/recommendations.js";

export const createApp = () => {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_request, response) => {
    response.status(200).json({
      message: "FloWiser backend foundation is running"
    });
  });

  app.use("/health", healthRouter);
  app.use("/telemetry", telemetryRouter);
  app.use("/raw-events", rawEventsRouter);
  app.use("/ingestion", ingestionRouter);
  app.use("/registry", registryRouter);
  app.use("/quality", qualityRouter);
  app.use("/state", stateRouter);
  app.use("/alerts", alertsRouter);
  app.use("/issues", issuesRouter);
  app.use("/field", fieldRouter);
  app.use("/rules", rulesRouter);
  app.use("/recommendations", recommendationsRouter);

  return app;
};
