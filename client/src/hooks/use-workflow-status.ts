import { useState } from "react";

export type WorkflowStatus = "planned" | "in-progress" | "live";

const STORAGE_KEY = "coreflow-workflow-status";

export function useWorkflowStatus() {
  const [statuses, setStatuses] = useState<Record<number, WorkflowStatus>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  const setStatus = (id: number, status: WorkflowStatus) => {
    const next = { ...statuses, [id]: status };
    setStatuses(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const getStatus = (id: number): WorkflowStatus => statuses[id] ?? "planned";

  return { getStatus, setStatus, statuses };
}
