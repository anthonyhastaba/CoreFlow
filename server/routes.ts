import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { getAuth, requireAuth } from "@clerk/express";

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
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const workflows = await storage.getWorkflows(userId);
    res.json(workflows);
  });

  app.get(api.workflows.get.path, async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const workflow = await storage.getWorkflow(Number(req.params.id), userId);
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
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const workflow = await storage.getWorkflow(Number(req.params.id), userId);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    const shareId = workflow.shareId || nanoid();
    const updated = await storage.updateWorkflow(workflow.id, userId, { isShared: true, shareId });
    res.json({ shareId: updated.shareId });
  });

  app.delete(api.workflows.delete.path, async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const workflow = await storage.getWorkflow(Number(req.params.id), userId);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }
    await storage.deleteWorkflow(Number(req.params.id), userId);
    res.status(204).end();
  });

  app.post(api.workflows.seedDemos.path, requireAuth(), async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    await seedDemoWorkflows(userId);
    const workflows = await storage.getWorkflows(userId);
    res.json(workflows);
  });

  app.post(api.workflows.create.path, requireAuth(), async (req, res) => {
    const { userId } = getAuth(req);
    console.log("[workflow.create] userId:", userId);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.workflows.create.input.parse(req.body);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
        userId,
      });

      res.status(201).json(workflow);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("[workflow.create] AI Generation Error:", err);
      res.status(500).json({ message: "Failed to generate workflow" });
    }
  });

  return httpServer;
}

async function seedDemoWorkflows(userId: string) {
  try {
    // Delete any old demo workflows before seeding new ones
    const existing = await storage.getWorkflows(userId);
    const OLD_DEMO_NAMES = [
      "Ad Creative Review & Approval",
      "Weekly Executive Performance Report",
      "New Client Contract Kickoff",
    ];
    for (const wf of existing) {
      if (OLD_DEMO_NAMES.includes(wf.name)) {
        await storage.deleteWorkflow(wf.id, userId);
      }
    }

    // 1) Advertiser Campaign Launch Checklist
    await storage.createWorkflow({
      userId,
      name: "Advertiser Campaign Launch Checklist",
      description: "Our ad ops team manually launches advertiser campaigns by retrieving creative assets from email, checking each asset against brand safety guidelines in a shared doc, verifying tracking pixels are firing correctly in the ad server, confirming budget caps are set properly, and sending a launch confirmation email to the client. We launch 25 campaigns per week. Each launch takes 35 minutes. Team hourly rate is $55.",
      originalProcess: [
        { id: "step1", name: "Asset Retrieval", description: "Download creative assets from client emails and cloud storage.", timeSpentMinutes: 5 },
        { id: "step2", name: "Brand Safety Check", description: "Cross-reference assets against brand safety guidelines.", timeSpentMinutes: 12 },
        { id: "step3", name: "Pixel Verification", description: "Verify tracking pixels are firing correctly in the ad server.", timeSpentMinutes: 8 },
        { id: "step4", name: "Budget Cap Confirmation", description: "Confirm budget caps and flight dates are configured correctly.", timeSpentMinutes: 5 },
        { id: "step5", name: "Launch Confirmation Email", description: "Send launch confirmation email to the advertiser.", timeSpentMinutes: 5 },
      ],
      automationBlueprint: [
        { id: "auto1", originalStepId: "step1", name: "Auto-fetch from Cloud Storage", description: "Automatically pull creative assets from cloud storage into the ad server.", toolUsed: "Make Standard", timeSavedMinutes: 4 },
        { id: "auto2", originalStepId: "step2", name: "AI-Powered Brand Safety Scan", description: "Use AI to scan assets against brand safety guidelines and flag violations.", toolUsed: "Zapier Professional", timeSavedMinutes: 10 },
        { id: "auto3", originalStepId: "step3", name: "Automated Pixel Validation", description: "Run automated pixel firing checks and surface pass/fail results.", toolUsed: "Make Standard", timeSavedMinutes: 7 },
        { id: "auto4", originalStepId: "step4", name: "Budget Rule Enforcement", description: "Auto-validate budget caps against insertion order rules before launch.", toolUsed: "Zapier Professional", timeSavedMinutes: 4 },
        { id: "auto5", originalStepId: "step5", name: "Templated Confirmation Send", description: "Auto-send a templated launch confirmation email upon campaign activation.", toolUsed: "Make Standard", timeSavedMinutes: 4 },
      ],
      runsPerWeek: 25,
      hourlyCost: 55,
      timeSavedWeekly: 12,
      timeSavedYearly: 624,
      priorityScore: 93,
      toolCostAnnual: 768, // Make Standard (288) + Zapier Professional (480)
    });

    // 2) Weekly Ad Performance Report
    await storage.createWorkflow({
      userId,
      name: "Weekly Ad Performance Report",
      description: "Every Monday our analyst manually exports campaign performance data from each ad platform, populates an Excel template with the numbers, builds charts, writes an executive summary, and emails the finished report to 20 stakeholders. This takes 4 hours every week without fail. Team hourly rate is $60.",
      originalProcess: [
        { id: "step1", name: "Data Export", description: "Export campaign data CSVs from each ad platform.", timeSpentMinutes: 90 },
        { id: "step2", name: "Excel Population", description: "Paste data into the Excel template and rebuild charts.", timeSpentMinutes: 60 },
        { id: "step3", name: "Executive Summary", description: "Write a performance summary narrative for the report.", timeSpentMinutes: 50 },
        { id: "step4", name: "Stakeholder Distribution", description: "Email the finished report to 20 stakeholders.", timeSpentMinutes: 40 },
      ],
      automationBlueprint: [
        { id: "auto1", originalStepId: "step1", name: "Automated Platform Data Connector", description: "Connect ad platforms directly to a central dashboard via API.", toolUsed: "Microsoft Power Automate", timeSavedMinutes: 80 },
        { id: "auto2", originalStepId: "step2", name: "Dynamic Dashboard Auto-Population", description: "Replace static Excel with a live dashboard that auto-populates.", toolUsed: "Google Workspace", timeSavedMinutes: 55 },
        { id: "auto3", originalStepId: "step3", name: "AI-Generated Performance Summary", description: "Use AI to draft the executive summary from the week's metrics.", toolUsed: "Microsoft Power Automate", timeSavedMinutes: 35 },
        { id: "auto4", originalStepId: "step4", name: "Scheduled Auto-Distribution", description: "Automatically send the report to all stakeholders on a schedule.", toolUsed: "Google Workspace", timeSavedMinutes: 30 },
      ],
      runsPerWeek: 1,
      hourlyCost: 60,
      timeSavedWeekly: 3,
      timeSavedYearly: 156,
      priorityScore: 88,
      toolCostAnnual: 252, // Microsoft Power Automate (180) + Google Workspace (72)
    });

    // 3) New Advertiser Onboarding
    await storage.createWorkflow({
      userId,
      name: "New Advertiser Onboarding",
      description: "When a new advertiser signs up, our team manually creates their platform account, sets up their billing profile, configures a starter campaign template, schedules an onboarding call, and sends welcome documentation. This happens about 30 times per month and each onboarding takes 50 minutes. Team hourly rate is $50.",
      originalProcess: [
        { id: "step1", name: "Account Creation", description: "Manually create the advertiser's platform account.", timeSpentMinutes: 15 },
        { id: "step2", name: "Billing Profile Setup", description: "Configure billing details and payment method.", timeSpentMinutes: 10 },
        { id: "step3", name: "Campaign Template Config", description: "Apply a starter campaign template to the new account.", timeSpentMinutes: 15 },
        { id: "step4", name: "Onboarding Call Scheduling", description: "Find availability and schedule the kickoff call.", timeSpentMinutes: 5 },
        { id: "step5", name: "Welcome Documentation", description: "Send welcome email with platform guides and next steps.", timeSpentMinutes: 5 },
      ],
      automationBlueprint: [
        { id: "auto1", originalStepId: "step1", name: "Auto-Provision Platform Account", description: "Automatically create the advertiser account upon contract signature.", toolUsed: "HubSpot Starter", timeSavedMinutes: 13 },
        { id: "auto2", originalStepId: "step2", name: "Billing Auto-Configuration", description: "Auto-populate billing profile from CRM data.", toolUsed: "Make Standard", timeSavedMinutes: 9 },
        { id: "auto3", originalStepId: "step3", name: "Template Auto-Apply", description: "Automatically apply the appropriate campaign template based on advertiser vertical.", toolUsed: "Zapier Starter", timeSavedMinutes: 13 },
        { id: "auto4", originalStepId: "step4", name: "Calendar Auto-Scheduler", description: "Auto-send a scheduling link and create the calendar event.", toolUsed: "HubSpot Starter", timeSavedMinutes: 4 },
        { id: "auto5", originalStepId: "step5", name: "Auto-Welcome Email Sequence", description: "Trigger a welcome email sequence with guides upon account creation.", toolUsed: "Make Standard", timeSavedMinutes: 4 },
      ],
      runsPerWeek: 7,
      hourlyCost: 50,
      timeSavedWeekly: 5,
      timeSavedYearly: 260,
      priorityScore: 92,
      toolCostAnnual: 1068, // HubSpot Starter (540) + Make Standard (288) + Zapier Starter (240)
    });
  } catch (err) {
    console.error("Seed error:", err);
  }
}
