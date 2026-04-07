import { Router } from "express";
import {
  issueAssignSchema,
  issueCommentSchema,
  issueResolveSchema,
  issueTransitionSchema
} from "../modules/alerts/alert-workflow.types.js";
import { platformServices } from "../modules/platform/platform-services.js";

export const issuesRouter = Router();

issuesRouter.get("/", async (request, response) => {
  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Issue workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const issues = await platformServices.alertWorkflowService.listIssues({
    siteId: request.query.siteId as string | undefined,
    deviceId: request.query.deviceId as string | undefined,
    status: request.query.status as string | undefined,
    assignee: request.query.assignee as string | undefined
  });

  return response.status(200).json({ issues });
});

issuesRouter.get("/:issueId", async (request, response) => {
  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Issue workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const issue = await platformServices.alertWorkflowService.getIssue(request.params.issueId);

  if (!issue) {
    return response.status(404).json({
      error: `Issue ${request.params.issueId} was not found`
    });
  }

  const comments = await platformServices.alertWorkflowService.listIssueComments(issue.issueId);

  return response.status(200).json({ issue, comments });
});

issuesRouter.post("/:issueId/assign", async (request, response) => {
  const parsed = issueAssignSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid assignment payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Issue workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const issue = await platformServices.alertWorkflowService.assignIssue(
    request.params.issueId,
    parsed.data.assignee
  );

  if (!issue) {
    return response.status(404).json({ error: `Issue ${request.params.issueId} was not found` });
  }

  return response.status(200).json(issue);
});

issuesRouter.post("/:issueId/acknowledge", async (request, response) => {
  const parsed = issueTransitionSchema.safeParse(request.body ?? {});

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid acknowledge payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Issue workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const issue = await platformServices.alertWorkflowService.transitionIssue(
    request.params.issueId,
    "acknowledged",
    parsed.data.actor
  );

  if (!issue) {
    return response.status(404).json({ error: `Issue ${request.params.issueId} was not found` });
  }

  return response.status(200).json(issue);
});

issuesRouter.post("/:issueId/investigate", async (request, response) => {
  const parsed = issueTransitionSchema.safeParse(request.body ?? {});

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid investigate payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Issue workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const issue = await platformServices.alertWorkflowService.transitionIssue(
    request.params.issueId,
    "investigating",
    parsed.data.actor
  );

  if (!issue) {
    return response.status(404).json({ error: `Issue ${request.params.issueId} was not found` });
  }

  return response.status(200).json(issue);
});

issuesRouter.post("/:issueId/resolve", async (request, response) => {
  const parsed = issueResolveSchema.safeParse(request.body ?? {});

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid resolve payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Issue workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const issue = await platformServices.alertWorkflowService.transitionIssue(
    request.params.issueId,
    "resolved",
    parsed.data.actor,
    parsed.data.resolutionNote
  );

  if (!issue) {
    return response.status(404).json({ error: `Issue ${request.params.issueId} was not found` });
  }

  return response.status(200).json(issue);
});

issuesRouter.post("/:issueId/close", async (request, response) => {
  const parsed = issueResolveSchema.safeParse(request.body ?? {});

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid close payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Issue workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const issue = await platformServices.alertWorkflowService.transitionIssue(
    request.params.issueId,
    "closed",
    parsed.data.actor,
    parsed.data.resolutionNote
  );

  if (!issue) {
    return response.status(404).json({ error: `Issue ${request.params.issueId} was not found` });
  }

  return response.status(200).json(issue);
});

issuesRouter.post("/:issueId/comments", async (request, response) => {
  const parsed = issueCommentSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid comment payload", details: parsed.error.flatten() });
  }

  if (!platformServices.alertWorkflowService) {
    return response.status(501).json({
      error: "Issue workflows are unavailable until DATABASE_URL is configured."
    });
  }

  const issue = await platformServices.alertWorkflowService.getIssue(request.params.issueId);

  if (!issue) {
    return response.status(404).json({ error: `Issue ${request.params.issueId} was not found` });
  }

  const comment = await platformServices.alertWorkflowService.addIssueComment(
    request.params.issueId,
    parsed.data.author,
    parsed.data.body,
    parsed.data.commentType
  );

  return response.status(201).json(comment);
});
