import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { platformServices } from "./modules/platform/platform-services.js";

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      persistenceEnabled: platformServices.persistenceEnabled,
      degradedServices: platformServices.persistenceEnabled
        ? [
            "rawEventArchive(in-memory hot cache)",
            "idempotency(in-memory)",
            "ordering(in-memory)",
            "deadLetter(in-memory)",
            "registry(in-memory)",
            "qualityHistory(in-memory)"
          ]
        : ["database-backed routes disabled"]
    },
    "FloWiser backend listening"
  );

  if (!platformServices.persistenceEnabled) {
    logger.warn(
      "DATABASE_URL is not configured. Persistent query routes and several operational services will return 501 until persistence is enabled."
    );
  }
});
