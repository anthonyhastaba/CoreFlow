import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const stepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  timeSpentMinutes: z.number(),
});

export const automatedStepSchema = z.object({
  id: z.string(),
  originalStepId: z.string().optional(),
  name: z.string(),
  description: z.string(),
  toolUsed: z.string(),
  timeSavedMinutes: z.number(),
});

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  originalProcess: jsonb("original_process").$type<z.infer<typeof stepSchema>[]>().notNull(),
  automationBlueprint: jsonb("automation_blueprint").$type<z.infer<typeof automatedStepSchema>[]>().notNull(),
  timeSavedWeekly: integer("time_saved_weekly").notNull(),
  timeSavedYearly: integer("time_saved_yearly").notNull(),
  priorityScore: integer("priority_score").notNull(),
  toolCostAnnual: integer("tool_cost_annual").default(0).notNull(),
  runsPerWeek: integer("runs_per_week"),
  hourlyCost: integer("hourly_cost"),
  isShared: boolean("is_shared").default(false).notNull(),
  shareId: text("share_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, createdAt: true, isShared: true, shareId: true });

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type CreateWorkflowRequest = { description: string };
