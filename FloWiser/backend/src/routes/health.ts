import { Router } from "express";

export const buildHealthPayload = () => ({
  status: "ok",
  service: "flowiser-backend",
  timestamp: new Date().toISOString()
});

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  response.status(200).json(buildHealthPayload());
});
