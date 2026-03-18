import { db } from "./db";
import { workflows, type Workflow, type InsertWorkflow } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getWorkflows(userId: string): Promise<Workflow[]>;
  getWorkflow(id: number, userId: string): Promise<Workflow | undefined>;
  getWorkflowByShareId(shareId: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, userId: string, updates: Partial<Workflow>): Promise<Workflow>;
  deleteWorkflow(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getWorkflows(userId: string): Promise<Workflow[]> {
    return await db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.createdAt));
  }

  async getWorkflow(id: number, userId: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
    return workflow;
  }

  async getWorkflowByShareId(shareId: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.shareId, shareId));
    return workflow;
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const [workflow] = await db.insert(workflows).values(insertWorkflow).returning();
    return workflow;
  }

  async updateWorkflow(id: number, userId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const [workflow] = await db.update(workflows).set(updates).where(and(eq(workflows.id, id), eq(workflows.userId, userId))).returning();
    return workflow;
  }

  async deleteWorkflow(id: number, userId: string): Promise<void> {
    await db.delete(workflows).where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
  }

}

export const storage = new DatabaseStorage();
