import { Router } from "express";
import { platformServices } from "../modules/platform/platform-services.js";

const parseLimit = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
};

export const brokerRouter = Router();

brokerRouter.get("/messages", async (request, response) => {
  if (!platformServices.brokerOutboxService) {
    return response.status(501).json({ error: "Broker outbox is unavailable until DATABASE_URL is configured." });
  }

  const messages = await platformServices.brokerOutboxService.listMessages({
    topic: request.query.topic as string | undefined,
    status: request.query.status as string | undefined,
    siteId: request.query.siteId as string | undefined,
    dispatchId: request.query.dispatchId as string | undefined,
    limit: parseLimit(request.query.limit)
  });

  return response.status(200).json({ messages });
});

brokerRouter.get("/messages/:messageId", async (request, response) => {
  if (!platformServices.brokerOutboxService) {
    return response.status(501).json({ error: "Broker outbox is unavailable until DATABASE_URL is configured." });
  }

  const message = await platformServices.brokerOutboxService.getMessage(request.params.messageId);
  if (!message) {
    return response.status(404).json({ error: `Broker message ${request.params.messageId} was not found` });
  }

  return response.status(200).json(message);
});
