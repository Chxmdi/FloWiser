import express from "express";
import { healthRouter } from "./routes/health.js";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.get("/", (_request, response) => {
    response.status(200).json({
      message: "FloWiser backend foundation is running"
    });
  });

  app.use("/health", healthRouter);

  return app;
};
