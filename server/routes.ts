import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

import { nanoid } from "nanoid";

const TOOL_COSTS: Record<string, number> = {
  "Zapier Starter": 240,
  "Zapier Professional": 480,
  "Make Basic": 96,
  "Make Standard": 288,
  "Okta": 1500,
  "Jira Software": 300,
  "HubSpot Starter": 540,
  "Salesforce Essentials": 3000,
  "Microsoft Power Automate": 180,
  "Workato": 15000,
  "BambooHR": 1200,
  "ServiceNow": 2400,
  "Slack": 96,
  "Google Workspace": 72,
};

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get(api.workflows.list.path, async (req, res) => {
    const workflows = await storage.getWorkflows();
    res.json(workflows);
  });

  app.get(api.workflows.get.path, async (req, res) => {
    const workflow = await storage.getWorkflow(Number(req.params.id));
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    res.json(workflow);
  });

  app.get(api.workflows.getShared.path, async (req, res) => {
    const workflow = await storage.getWorkflowByShareId(req.params.shareId);
    if (!workflow || !workflow.isShared) {
      return res.status(404).json({ message: 'Shared workflow not found' });
    }
    res.json(workflow);
  });

  app.post(api.workflows.share.path, async (req, res) => {
    const workflow = await storage.getWorkflow(Number(req.params.id));
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    const shareId = workflow.shareId || nanoid();
    const updated = await storage.updateWorkflow(workflow.id, { isShared: true, shareId });
    res.json({ shareId: updated.shareId });
  });

  app.delete(api.workflows.delete.path, async (req, res) => {
    const workflow = await storage.getWorkflow(Number(req.params.id));
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    await storage.deleteWorkflow(Number(req.params.id));
    res.status(204).end();
  });

  app.post(api.workflows.create.path, async (req, res) => {
    try {
      const input = api.workflows.create.input.parse(req.body);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `You are an expert AI workflow automation architect. Analyze the given manual business process description and output a structured JSON response. 
The JSON must contain:
1. "name": A concise name for this workflow (e.g., "Invoice Processing")
2. "originalProcess": Array of objects { "id": "step1", "name": "...", "description": "...", "timeSpentMinutes": number }
3. "automationBlueprint": Array of objects { "id": "auto1", "originalStepId": "step1", "name": "...", "description": "...", "toolUsed": "...", "timeSavedMinutes": number }
4. "timeSavedWeekly": Total estimated hours saved per week (number)
5. "timeSavedYearly": Total estimated hours saved per year (number)
6. "priorityScore": A score from 1-100 indicating implementation priority based on impact and effort (number)
7. "runsPerWeek": Estimated frequency of this process per week based on description (number, e.g., 40)
8. "hourlyCost": Estimated team hourly rate if mentioned, otherwise default to 45 (number)
9. "toolRecommendations": Array of strings representing tool names recommended. Choose from: ${Object.keys(TOOL_COSTS).join(", ")}. If you need another tool, use one of these if it is a close match, otherwise use the most accurate name.

Output ONLY valid JSON matching this structure. Do not use markdown blocks.`
          },
          {
            role: "user",
            content: input.description
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("No response from AI");

      const parsed = JSON.parse(content);
      
      // Calculate tool cost from database
      const recommendedTools = parsed.toolRecommendations || [];
      const toolCostAnnual = recommendedTools.reduce((acc: number, tool: string) => {
        return acc + (TOOL_COSTS[tool] || 0);
      }, 0);

      const workflow = await storage.createWorkflow({
        name: parsed.name || "Automated Workflow",
        description: input.description,
        originalProcess: parsed.originalProcess || [],
        automationBlueprint: parsed.automationBlueprint || [],
        timeSavedWeekly: Math.round(parsed.timeSavedWeekly || 0),
        timeSavedYearly: Math.round(parsed.timeSavedYearly || 0),
        priorityScore: Math.round(parsed.priorityScore || 50),
        toolCostAnnual: toolCostAnnual,
        runsPerWeek: Math.round(parsed.runsPerWeek || 5),
        hourlyCost: Math.round(parsed.hourlyCost || 45),
      });

      res.status(201).json(workflow);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("AI Generation Error:", err);
      res.status(500).json({ message: "Failed to generate workflow" });
    }
  });

  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existing = await storage.getWorkflows();
    if (existing.length === 0) {
      // 1) Ad Creative Review & Approval
      await storage.createWorkflow({
        name: "Ad Creative Review & Approval",
        description: "Our operations team manually reviews advertiser creative assets by downloading files from email, cross-referencing brand guidelines in a Google Doc, logging feedback in a spreadsheet, emailing revision requests back to clients, and updating a Notion tracker with approval status. We process 40 creatives per week. Each review takes 25 minutes. Team hourly rate is $45.",
        originalProcess: [
          { id: "step1", name: "Download Assets", description: "Download files from client emails.", timeSpentMinutes: 5 },
          { id: "step2", name: "Guideline Review", description: "Cross-reference brand guidelines in Google Docs.", timeSpentMinutes: 10 },
          { id: "step3", name: "Feedback Logging", description: "Log feedback and email revision requests.", timeSpentMinutes: 7 },
          { id: "step4", name: "Status Update", description: "Update Notion tracker with approval status.", timeSpentMinutes: 3 }
        ],
        automationBlueprint: [
          { id: "auto1", originalStepId: "step1", name: "Email Parser & Asset Sync", description: "Automatically extract attachments and save to Cloud Storage.", toolUsed: "Make Standard", timeSavedMinutes: 4 },
          { id: "auto2", originalStepId: "step2", name: "AI Guideline Compliance", description: "Use LLM to flag potential brand guideline violations.", toolUsed: "Zapier Professional", timeSavedMinutes: 8 },
          { id: "auto3", originalStepId: "step4", name: "Auto-Status Sync", description: "Automatically update Notion when review is marked complete.", toolUsed: "Slack", timeSavedMinutes: 2 }
        ],
        timeSavedWeekly: 9,
        timeSavedYearly: 468,
        priorityScore: 94,
        toolCostAnnual: 768, // Make Standard (288) + Zapier Professional (480)
      });

      // 2) Weekly Executive Performance Report
      await storage.createWorkflow({
        name: "Weekly Executive Performance Report",
        description: "Every Monday our analyst manually exports data from Google Analytics, Salesforce, and our internal dashboard into separate CSV files, consolidates everything into an Excel template, builds charts manually, writes a 2 paragraph executive summary, and emails the finished report to 15 stakeholders. This takes 3 hours every single week without fail. Team hourly rate is $55.",
        originalProcess: [
          { id: "step1", name: "Data Export", description: "Export CSVs from GA, Salesforce, and Dashboard.", timeSpentMinutes: 60 },
          { id: "step2", name: "Data Consolidation", description: "Consolidate into Excel and build charts.", timeSpentMinutes: 90 },
          { id: "step3", name: "Report Writing", description: "Write summary and email 15 stakeholders.", timeSpentMinutes: 30 }
        ],
        automationBlueprint: [
          { id: "auto1", originalStepId: "step1", name: "Automated Data Fetch", description: "Sync data directly into a central warehouse or sheet.", toolUsed: "Salesforce Essentials", timeSavedMinutes: 55 },
          { id: "auto2", originalStepId: "step2", name: "Dynamic Dashboard", description: "Replace static Excel with real-time Looker/Tableau.", toolUsed: "Microsoft Power Automate", timeSavedMinutes: 85 },
          { id: "auto3", originalStepId: "step3", name: "AI Summary Generation", description: "Draft executive summary based on weekly metrics.", toolUsed: "Google Workspace", timeSavedMinutes: 20 }
        ],
        timeSavedWeekly: 3,
        timeSavedYearly: 156,
        priorityScore: 89,
        toolCostAnnual: 3252, // Salesforce (3000) + Power Automate (180) + Google Workspace (72)
      });

      // 3) New Client Contract Kickoff
      await storage.createWorkflow({
        name: "New Client Contract Kickoff",
        description: "When a client signs a contract our team manually sends a personalized welcome email, creates their account in Salesforce, opens a dedicated Slack channel, schedules a kickoff call via Calendly, builds a new project in Asana with 12 standard onboarding tasks, generates login credentials, and mails a welcome package. This happens 15 times per month and takes 45 minutes per client. Team hourly rate is $50.",
        originalProcess: [
          { id: "step1", name: "CRM & Slack Setup", description: "Create Salesforce account and Slack channel.", timeSpentMinutes: 15 },
          { id: "step2", name: "Project & Task Setup", description: "Build project in Asana with 12 tasks.", timeSpentMinutes: 20 },
          { id: "step3", name: "Communication & Logistics", description: "Send welcome email and schedule call.", timeSpentMinutes: 10 }
        ],
        automationBlueprint: [
          { id: "auto1", originalStepId: "step1", name: "Contract-to-Provisioning", description: "Trigger account creation and channel opening from signature.", toolUsed: "HubSpot Starter", timeSavedMinutes: 14 },
          { id: "auto2", originalStepId: "step2", name: "Asana Template Automation", description: "Auto-duplicate project template with due dates.", toolUsed: "Jira Software", timeSavedMinutes: 18 },
          { id: "auto3", originalStepId: "step3", name: "Auto-Scheduler Sync", description: "Sync signature date with kickoff scheduling.", toolUsed: "HubSpot Starter", timeSavedMinutes: 8 }
        ],
        timeSavedWeekly: 3,
        timeSavedYearly: 156,
        priorityScore: 91,
        toolCostAnnual: 1380, // HubSpot Starter (540) + Jira Software (300) + HubSpot Starter (540)
      });
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
}
