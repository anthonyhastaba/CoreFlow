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
import { Plus, WorkflowIcon, Trash2, Loader2, Library, LogOut } from "lucide-react";
import { useWorkflows, useDeleteWorkflow } from "@/hooks/use-workflows";
import { useUser, useClerk } from "@clerk/clerk-react";
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


export function WorkflowSidebar() {
  const { data: workflows, isLoading } = useWorkflows();
  const deleteMutation = useDeleteWorkflow();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2.5 mb-4 px-1 text-sidebar-foreground">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_-4px_rgba(139,92,246,0.8)]">
            <WorkflowIcon className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">CoreFlow</span>
          </span>
        </div>
        <div className="space-y-1.5">
          <Link href="/dashboard" className="w-full">
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
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mt-3 mb-0.5" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mx-2 mb-1" />
        <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-4 py-2 font-bold">
            Your Workflows
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
                return (
                  <SidebarMenuItem key={wf.id}>
                    <div className="flex group w-full items-center gap-1">
                      <Link href={`/workflow/${wf.id}`} className="flex-1 min-w-0">
                        <SidebarMenuButton
                          isActive={isActive}
                          className={`w-full justify-start hover-elevate transition-all duration-200 py-3 h-auto rounded-xl ${
                            isActive
                              ? "bg-primary/10 border border-primary/20 shadow-[inset_3px_0_0_0_hsl(var(--primary)),_0_0_20px_-8px_rgba(139,92,246,0.3)]"
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
                          if (confirm("Permanently delete this workflow? This cannot be undone.")) {
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

      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-primary uppercase">
              {(user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0] || "U")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate leading-tight">
              {user?.firstName || user?.emailAddresses[0]?.emailAddress || "User"}
            </p>
            {user?.firstName && (
              <p className="text-[10px] text-muted-foreground/50 truncate leading-tight">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            )}
          </div>
          <button
            onClick={() => signOut()}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-secondary/80 transition-colors shrink-0"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
