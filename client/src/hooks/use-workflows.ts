import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api, buildUrl } from "@shared/routes";
import { type Workflow, type CreateWorkflowRequest } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw new Error(`Data validation failed for ${label}`);
  }
  return result.data;
}

export function useWorkflows() {
  return useQuery({
    queryKey: [api.workflows.list.path],
    queryFn: async () => {
      const res = await fetch(api.workflows.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workflows");
      const data = await res.json();
      return parseWithLogging(api.workflows.list.responses[200], data, "workflows.list");
    },
  });
}

export function useWorkflow(id: number | null) {
  return useQuery({
    queryKey: [api.workflows.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.workflows.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch workflow");
      const data = await res.json();
      return parseWithLogging(api.workflows.get.responses[200], data, "workflows.get");
    },
    enabled: id !== null,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateWorkflowRequest) => {
      const token = await getToken();
      const res = await fetch(api.workflows.create.path, {
        method: api.workflows.create.method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate workflow");
      }
      
      const responseData = await res.json();
      return parseWithLogging(api.workflows.create.responses[201], responseData, "workflows.create");
    },
    onSuccess: (newWorkflow) => {
      queryClient.invalidateQueries({ queryKey: [api.workflows.list.path] });
    },
  });
}

export function useSeedDemos() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/workflows/seed-demos', {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to seed demos');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workflows.list.path] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.workflows.delete.path, { id });
      const res = await fetch(url, {
        method: api.workflows.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete workflow");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workflows.list.path] });
    },
  });
}
