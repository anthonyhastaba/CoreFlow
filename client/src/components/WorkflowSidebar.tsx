import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Plus, WorkflowIcon, Trash2, Loader2, Library } from "lucide-react";
import { useWorkflows, useDeleteWorkflow } from "@/hooks/use-workflows";
import { useWorkflowStatus } from "@/hooks/use-workflow-status";
import { format } from "date-fns";
import { Link, useLocation } from "wouter";

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 85
      ? "bg-emerald-500 shadow-[0_0_6px_0px_rgba(52,211,153,0.7)]"
      : score >= 70
      ? "bg-primary shadow-[0_0_6px_0px_rgba(139,92,246,0.7)]"
      : "bg-amber-500 shadow-[0_0_6px_0px_rgba(245,158,11,0.7)]";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 cursor-default ${color}`} />
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        Score: {score}
      </TooltipContent>
    </Tooltip>
  );
}

function StatusDot({ status }: { status: "planned" | "in-progress" | "live" }) {
  if (status === "planned") return null;
  if (status === "live") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="relative flex h-1.5 w-1.5 shrink-0 cursor-default">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">Live</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400 shadow-[0_0_5px_0px_rgba(96,165,250,0.7)] cursor-default" />
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">In Progress</TooltipContent>
    </Tooltip>
  );
}

export function WorkflowSidebar() {
  const { data: workflows, isLoading } = useWorkflows();
  const deleteMutation = useDeleteWorkflow();
  const { getStatus } = useWorkflowStatus();
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2.5 mb-4 px-1 text-sidebar-foreground">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.7)]">
            <WorkflowIcon className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">CoreFlow</span>
        </div>
        <div className="space-y-1.5">
          <Link href="/" className="w-full">
            <Button className="w-full justify-start gap-2 hover-elevate bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 h-9 text-sm font-medium">
              <Plus className="w-4 h-4" />
              New Automation
            </Button>
          </Link>
          <Link href="/library" className="w-full">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-2 h-9 text-sm transition-all duration-200 ${
                location === "/library"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Library className="w-4 h-4" />
              Library
            </Button>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-4 py-2 font-bold">
            Recent Workflows
          </SidebarGroupLabel>

          <SidebarMenu className="px-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : workflows?.length === 0 ? (
              <div className="text-center p-4 text-xs text-muted-foreground/60">
                No workflows generated yet.
              </div>
            ) : (
              workflows?.map((wf) => {
                const isActive = location === `/workflow/${wf.id}`;
                const status = getStatus(wf.id);
                return (
                  <SidebarMenuItem key={wf.id}>
                    <div className="flex group w-full items-center gap-1">
                      <Link href={`/workflow/${wf.id}`} className="flex-1 min-w-0">
                        <SidebarMenuButton
                          isActive={isActive}
                          className={`w-full justify-start hover-elevate transition-all duration-200 py-3 h-auto rounded-xl ${
                            isActive
                              ? "bg-sidebar-accent border border-primary/20 shadow-[inset_2px_0_0_0_hsl(var(--primary))]"
                              : "hover:bg-sidebar-accent/50"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 overflow-hidden w-full">
                            <ScoreDot score={wf.priorityScore} />
                            <div className="flex flex-col items-start gap-0.5 text-left overflow-hidden min-w-0 flex-1">
                              <span className="font-medium text-sm leading-snug whitespace-normal break-words w-full pr-1">
                                {wf.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground/50">
                                  {format(new Date(wf.createdAt), "MMM d, yyyy")} · {wf.priorityScore}
                                </span>
                                <StatusDot status={status} />
                              </div>
                            </div>
                          </div>
                        </SidebarMenuButton>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm("Delete this workflow?")) {
                            deleteMutation.mutate(wf.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                );
              })
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50 text-[10px] text-muted-foreground/40 text-center tracking-wide">
        CoreFlow Automation Engine v1.0
      </SidebarFooter>
    </Sidebar>
  );
}
