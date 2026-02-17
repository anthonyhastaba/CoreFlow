import { Switch, Route, useRoute, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import NotFound from "@/pages/not-found";
import { WorkflowSidebar } from "@/components/WorkflowSidebar";
import GeneratePage from "@/pages/Generate";
import WorkflowDetailsPage from "@/pages/WorkflowDetails";
import LibraryPage from "@/pages/Library";
import SharedReportPage from "@/pages/SharedReport";
import ComparePage from "@/pages/Compare";

function ShareRedirect() {
  const [, params] = useRoute("/share/:shareId");
  const [, setLocation] = useLocation();
  const shareId = params?.shareId;
  useEffect(() => {
    if (shareId) setLocation(`/shared/${shareId}`);
  }, [shareId, setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={GeneratePage} />
      <Route path="/workflow/:id" component={WorkflowDetailsPage} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/share/:shareId" component={ShareRedirect} />
      <Route path="/shared/:shareId" component={SharedReportPage} />
      <Route path="/compare" component={ComparePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle}>
          <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
            <WorkflowSidebar />
            <div className="flex flex-col flex-1 min-w-0 relative">
              <header className="absolute top-0 left-0 right-0 p-4 z-50 flex items-center justify-between pointer-events-none">
                <SidebarTrigger className="pointer-events-auto bg-background/50 backdrop-blur border border-border text-foreground hover:bg-secondary" />
              </header>
              <main className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
