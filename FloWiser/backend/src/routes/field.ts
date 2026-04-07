import { Router } from "express";
import {
  checklistCompleteSchema,
  checklistCreateSchema,
  fieldTaskCompleteSchema,
  fieldTaskCreateSchema,
  rollbackNoteSchema,
  siteVisitCreateSchema
} from "../modules/alerts/alert-workflow.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

export const fieldRouter = Router();

fieldRouter.get("/checklists", async (request, response) => {
  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Field workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const checklists = await platformServices.alertWorkflowService.listChecklists(
    request.query.siteId as string | undefined
  );
  return response.status(200).json({ checklists });
});

fieldRouter.post("/checklists", async (request, response) => {
  const parsed = checklistCreateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid checklist payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Field workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const checklist = await platformServices.alertWorkflowService.createChecklist(parsed.data);
  return response.status(201).json(checklist);
});

fieldRouter.post("/checklists/:checklistId/complete", async (request, response) => {
  const parsed = checklistCompleteSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid checklist completion payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Field workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const checklist = await platformServices.alertWorkflowService.completeChecklist(
    request.params.checklistId,
    parsed.data.completedBy
  );

  if (!checklist) {
    return response.status(404).json({ error: `Checklist ${request.params.checklistId} was not found` });
  }

  return response.status(200).json(checklist);
});

fieldRouter.get("/tasks", async (request, response) => {
  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Field workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const tasks = await platformServices.alertWorkflowService.listFieldTasks(
    request.query.siteId as string | undefined
  );
  return response.status(200).json({ tasks });
});

fieldRouter.post("/tasks", async (request, response) => {
  const parsed = fieldTaskCreateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid field task payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Field workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const task = await platformServices.alertWorkflowService.createFieldTask(parsed.data);
  return response.status(201).json(task);
});

fieldRouter.post("/tasks/:taskId/complete", async (request, response) => {
  const parsed = fieldTaskCompleteSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid task completion payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Field workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const task = await platformServices.alertWorkflowService.completeFieldTask(
    request.params.taskId,
    parsed.data.completionNote,
    parsed.data.evidenceUrls
  );

  if (!task) {
    return response.status(404).json({ error: `Task ${request.params.taskId} was not found` });
  }

  return response.status(200).json(task);
});

fieldRouter.post("/tasks/:taskId/rollback-note", async (request, response) => {
  const parsed = rollbackNoteSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid rollback payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Field workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const task = await platformServices.alertWorkflowService.addRollbackNote(
    request.params.taskId,
    parsed.data.rollbackNote
  );

  if (!task) {
    return response.status(404).json({ error: `Task ${request.params.taskId} was not found` });
  }

  return response.status(200).json(task);
});

fieldRouter.get("/site-visits", async (request, response) => {
  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Field workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const visits = await platformServices.alertWorkflowService.listSiteVisits(
    request.query.siteId as string | undefined
  );
  return response.status(200).json({ visits });
});

fieldRouter.post("/site-visits", async (request, response) => {
  const parsed = siteVisitCreateSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid site visit payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Field workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const visit = await platformServices.alertWorkflowService.createSiteVisit(parsed.data);
  return response.status(201).json(visit);
});
