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
import { dashboardRouter } from "./routes/dashboard.js";
import { controlsRouter } from "./routes/controls.js";
import { commandsRouter } from "./routes/commands.js";
import { accessRouter } from "./routes/access.js";
import { reportingRouter } from "./routes/reporting.js";
import { createAuditLoggingMiddleware, createProtectedRouteMiddleware } from "./modules/access/access.middleware.js";
import { platformServices } from "./modules/platform/platform-services.js";

export const createApp = () => {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  const viewerAccess = createProtectedRouteMiddleware(platformServices.accessAuthorizationService, [
    "viewer",
    "operator",
    "tenant_admin",
    "platform_admin"
  ]);
  const operatorAccess = createProtectedRouteMiddleware(platformServices.accessAuthorizationService, [
    "operator",
    "tenant_admin",
    "platform_admin"
  ]);
  const adminAccess = createProtectedRouteMiddleware(platformServices.accessAuthorizationService, [
    "tenant_admin",
    "platform_admin"
  ]);
  const audit = createAuditLoggingMiddleware(platformServices.accessAuditService);

  app.get("/", (_request, response) => {
    response.status(200).json({
      message: "FloWiser backend foundation is running"
    });
  });

  app.use("/health", healthRouter);
  app.use("/telemetry", telemetryRouter);
  app.use("/ingestion", ingestionRouter);
  app.use("/raw-events", operatorAccess, audit, rawEventsRouter);
  app.use("/registry", adminAccess, audit, registryRouter);
  app.use("/quality", viewerAccess, audit, qualityRouter);
  app.use("/state", viewerAccess, audit, stateRouter);
  app.use("/alerts", viewerAccess, audit, alertsRouter);
  app.use("/issues", operatorAccess, audit, issuesRouter);
  app.use("/field", operatorAccess, audit, fieldRouter);
  app.use("/rules", adminAccess, audit, rulesRouter);
  app.use("/recommendations", operatorAccess, audit, recommendationsRouter);
  app.use("/dashboard", viewerAccess, audit, dashboardRouter);
  app.use("/controls", operatorAccess, audit, controlsRouter);
  app.use("/commands", operatorAccess, audit, commandsRouter);
  app.use("/access", viewerAccess, audit, accessRouter);
  app.use("/reporting", viewerAccess, audit, reportingRouter);

  return app;
};
