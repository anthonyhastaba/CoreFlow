import { useRoute, useLocation } from "wouter";
import { useWorkflow } from "@/hooks/use-workflows";
import { useCountUp } from "@/hooks/use-count-up";
import { useWorkflowStatus } from "@/hooks/use-workflow-status";
import { MetricCard } from "@/components/MetricCard";
import { FlowchartVisualizer } from "@/components/FlowchartVisualizer";
import {
  AlertCircle, Calculator, FileDown, DollarSign, Loader2, Zap,
  TrendingUp, Clock, Target, Share2, ArrowRight, RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// ─── Skeleton ────────────────────────────────────────────────────────────────
function WorkflowDetailsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 w-40 bg-secondary/60 rounded-full" />
          <div className="h-12 w-2/3 bg-secondary/60 rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-secondary/40 rounded" />
            <div className="h-4 w-4/5 bg-secondary/40 rounded" />
          </div>
        </div>
        <div className="h-72 bg-secondary/30 rounded-2xl border border-border/40" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-secondary/30 rounded-xl border border-border/40" />
          ))}
        </div>
        <div className="h-96 bg-secondary/30 rounded-2xl border border-border/40" />
      </div>
    </div>
  );
}

// ─── Status Selector ─────────────────────────────────────────────────────────
type StatusOption = { value: "planned" | "in-progress" | "live"; label: string };
const STATUS_OPTIONS: StatusOption[] = [
  { value: "planned",     label: "Planned"     },
  { value: "in-progress", label: "In Progress" },
  { value: "live",        label: "Live"        },
];

const STATUS_STYLES = {
  planned:     "bg-amber-500/10  text-amber-400  border-amber-500/20",
  "in-progress": "bg-blue-500/10   text-blue-400   border-blue-500/20",
  live:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function StatusSelector({ workflowId }: { workflowId: number }) {
  const { getStatus, setStatus } = useWorkflowStatus();
  const current = getStatus(workflowId);

  return (
    <div className="flex items-center gap-1 bg-secondary/30 border border-border/50 rounded-xl p-1">
      {STATUS_OPTIONS.map(({ value, label }) => {
        const isActive = current === value;
        return (
          <button
            key={value}
            onClick={() => setStatus(workflowId, value)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
              isActive
                ? `border ${STATUS_STYLES[value]} shadow-sm`
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {value === "live" && isActive && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorkflowDetailsPage() {
  const [, params] = useRoute("/workflow/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : null;
  const { data: workflow, isLoading, error } = useWorkflow(id);
  const { toast } = useToast();

  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", buildUrl(api.workflows.share.path, { id: id! }));
      return await res.json();
    },
    onSuccess: (data) => {
      const shareUrl = `${window.location.origin}/shared/${data.shareId}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Professional report link copied to clipboard." });
    },
  });

  const [runsPerWeek, setRunsPerWeek] = useState<number | null>(null);
  const [hourlyCost, setHourlyCost] = useState<number | null>(null);

  // All calculations use safe fallbacks — hooks must be called before any early returns
  const defaultRuns = workflow?.name === "Ad Creative Review & Approval" ? 40
    : workflow?.name === "Weekly Executive Performance Report" ? 1
    : workflow?.name === "New Client Contract Kickoff" ? 4
    : 5;
  const defaultCost = workflow?.name === "Ad Creative Review & Approval" ? 45
    : workflow?.name === "Weekly Executive Performance Report" ? 55
    : workflow?.name === "New Client Contract Kickoff" ? 50
    : 35;

  const currentRuns = runsPerWeek ?? workflow?.runsPerWeek ?? defaultRuns;
  const currentHourlyCost = hourlyCost ?? workflow?.hourlyCost ?? defaultCost;

  const totalManualTimeMinutes = workflow?.originalProcess.reduce((acc: number, step: any) => acc + step.timeSpentMinutes, 0) ?? 0;
  const totalSavedTimeMinutes = workflow?.automationBlueprint.reduce((acc: number, step: any) => acc + step.timeSavedMinutes, 0) ?? 0;

  const annualManualCost = Math.round((totalManualTimeMinutes / 60) * currentHourlyCost * currentRuns * 52);
  const annualSavings = Math.round((totalSavedTimeMinutes / 60) * currentHourlyCost * currentRuns * 52);
  const weeklySavedHours = Math.round((totalSavedTimeMinutes * currentRuns) / 60);
  const toolCost = Math.round((workflow as any)?.toolCostAnnual || 0);
  const promptNetFirstYearSavings = annualManualCost - toolCost;
  const fiveYearManualCost = annualManualCost * 5;
  const fiveYearToolCost = toolCost * 5;
  const promptFiveYearROI = toolCost > 0 ? (((fiveYearManualCost - fiveYearToolCost) / fiveYearToolCost) * 100).toFixed(0) : "100";
  const monthlySavings = annualSavings / 12;
  const promptPaybackMonths = monthlySavings > 0 ? (toolCost / monthlySavings).toFixed(1) : "0";
  const efficiencyPct = Math.round((totalSavedTimeMinutes / Math.max(totalManualTimeMinutes, 1)) * 100);

  // Hooks must be called unconditionally before any early returns
  const displayedManualCost = useCountUp(annualManualCost);
  const displayedNetSavings = useCountUp(Math.abs(promptNetFirstYearSavings));

  const isSavingPositive = promptNetFirstYearSavings > 0;

  if (isLoading) return <WorkflowDetailsSkeleton />;

  if (error || !workflow) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen space-y-4 text-muted-foreground">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-display font-semibold text-foreground">Workflow not found</h2>
        <p>The automation blueprint you are looking for doesn't exist.</p>
      </div>
    );
  }

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(59, 130, 246);
    doc.rect(14, 15, 8, 8, "F");
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("CoreFlow", 25, 22);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Professional Workflow Automation Report", 14, 32);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(workflow.name, 14, 45);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(workflow.createdAt).toLocaleDateString()}`, 14, 52);
    doc.setFontSize(12);
    doc.text("Workflow Description", 14, 65);
    const splitDesc = doc.splitTextToSize(workflow.description, 180);
    doc.setFontSize(10);
    doc.text(splitDesc, 14, 72);
    const processY = 72 + splitDesc.length * 5 + 10;
    doc.setFontSize(12);
    doc.text("Current Manual Process", 14, processY);
    autoTable(doc, {
      startY: processY + 5,
      head: [["Step", "Description", "Time (min)"]],
      body: workflow.originalProcess.map((s: any) => [s.name, s.description, s.timeSpentMinutes]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    });
    const blueprintY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text("Automation Blueprint", 14, blueprintY);
    autoTable(doc, {
      startY: blueprintY + 5,
      head: [["Automation", "Tool", "Description", "Time Saved (min)"]],
      body: workflow.automationBlueprint.map((s: any) => [s.name, s.toolUsed, s.description, s.timeSavedMinutes]),
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
    });
    const roiPDFY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text("Financial Impact & ROI", 14, roiPDFY);
    autoTable(doc, {
      startY: roiPDFY + 5,
      body: [
        ["Annual Manual Cost", `$${annualManualCost.toLocaleString()}`],
        ["Annual Tool Cost", `$${toolCost.toLocaleString()}`],
        ["Net First Year Savings", `$${promptNetFirstYearSavings.toLocaleString()}`],
        ["Payback Period", `${promptPaybackMonths} Months`],
        ["5 Year ROI", `${promptFiveYearROI}%`],
      ],
      theme: "grid",
    });
    doc.save(`${workflow.name.replace(/\s+/g, "_")}_Analysis_Report.pdf`);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                  <Zap className="w-4 h-4" />
                  Automation Blueprint
                </div>
                {/* Status selector */}
                <StatusSelector workflowId={workflow.id} />
              </div>
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground">
                {workflow.name}
              </h1>
            </div>

            {/* Grouped action buttons */}
            <div className="flex items-center shrink-0 divide-x divide-border rounded-xl border border-border overflow-hidden">
              <Button
                onClick={() => shareMutation.mutate()}
                variant="ghost"
                className="rounded-none h-9 px-4 gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                disabled={shareMutation.isPending}
              >
                {shareMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Share2 className="w-4 h-4" />}
                Share
              </Button>
              <Button
                onClick={exportPDF}
                variant="ghost"
                className="rounded-none h-9 px-4 gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Export
              </Button>
              <Button
                onClick={() =>
                  setLocation(`/?prefill=${encodeURIComponent(workflow.description)}`)
                }
                variant="ghost"
                className="rounded-none h-9 px-4 gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Re-analyze
              </Button>
            </div>
          </div>
          <div className="max-w-3xl flex gap-4 pt-1">
            <div className="w-0.5 bg-gradient-to-b from-primary/60 via-primary/20 to-transparent rounded-full shrink-0" />
            <p className="text-lg text-muted-foreground leading-relaxed">{workflow.description}</p>
          </div>
        </motion.div>

        {/* ROI Calculator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <CardTitle>ROI Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {!isSavingPositive && (
                <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    Tool costs currently exceed manual labor costs. Consider lower cost alternative tools to maximize ROI.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="runs">Runs per week</Label>
                    <Input
                      id="runs"
                      type="number"
                      value={currentRuns}
                      onChange={(e) => setRunsPerWeek(Number(e.target.value))}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Average hourly cost ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={currentHourlyCost}
                      onChange={(e) => setHourlyCost(Number(e.target.value))}
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-background/30 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Annual Manual Cost</p>
                    <p className="text-2xl font-display font-bold tabular-nums">
                      ${displayedManualCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/30 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Annual Tool Cost</p>
                    <p className="text-2xl font-display font-bold">${toolCost.toLocaleString()}</p>
                  </div>
                  <div className={`p-5 rounded-xl border col-span-2 relative overflow-hidden ${isSavingPositive ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                    <div className={`absolute inset-0 opacity-25 bg-gradient-to-br ${isSavingPositive ? "from-green-500/20" : "from-amber-500/20"} to-transparent pointer-events-none`} />
                    <div className="relative flex items-center justify-between gap-4">
                      <div>
                        <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${isSavingPositive ? "text-green-500/70" : "text-amber-500/70"}`}>
                          {isSavingPositive ? "Net First Year Savings" : "First Year Net Position"}
                        </p>
                        <p className={`text-4xl font-display font-bold tabular-nums ${isSavingPositive ? "text-green-400 glow-green-text" : "text-amber-400"}`}>
                          ${displayedNetSavings.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-widest font-bold mb-1 text-muted-foreground/60">Payback Period</p>
                        <p className="text-2xl font-display font-bold text-foreground">
                          {isSavingPositive ? `${promptPaybackMonths} Months` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Tool Cost</p>
                    <p className="font-semibold">${toolCost.toLocaleString()}/year</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">5 Year ROI</p>
                    <p className="font-semibold text-green-500">{isSavingPositive ? `${promptFiveYearROI}%` : "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Annual Hours Reclaimed</p>
                    <p className="font-semibold text-blue-500">{Math.round(weeklySavedHours * 52).toLocaleString()}h</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Time Saved (Weekly)"
            value={`${workflow.timeSavedWeekly}h`}
            subtitle={`Based on ${totalManualTimeMinutes}m per run`}
            icon={<Clock className="w-6 h-6" />}
            trend="up"
            trendValue={`${Math.round((totalSavedTimeMinutes / totalManualTimeMinutes) * 100) || 0}% faster`}
            delay={0.3}
          />
          <MetricCard
            title="Time Saved (Yearly)"
            value={`${workflow.timeSavedYearly}h`}
            subtitle="Estimated annual projection"
            icon={<TrendingUp className="w-6 h-6" />}
            delay={0.4}
          />
          <MetricCard
            title="Priority Score"
            value={`${workflow.priorityScore}/100`}
            subtitle="Implementation impact rating"
            icon={<Target className="w-6 h-6" />}
            trend={workflow.priorityScore >= 80 ? "up" : "neutral"}
            trendValue={workflow.priorityScore >= 80 ? "High Impact" : "Medium Impact"}
            delay={0.5}
          />
          <MetricCard
            title="Steps Automated"
            value={`${workflow.automationBlueprint.length}`}
            subtitle={`Out of ${workflow.originalProcess.length} total steps`}
            icon={<Zap className="w-6 h-6" />}
            delay={0.6}
          />
        </div>

        {/* Flowchart Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold">Process Architecture</h2>
          </div>

          {/* Summary strip */}
          <div className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-secondary/20 border border-border/40 text-sm flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-mono text-xs bg-secondary/80 px-2 py-0.5 rounded font-bold">
                {workflow.originalProcess.length}
              </span>
              <span>manual steps</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-primary/40 shrink-0" />
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Zap className="w-3.5 h-3.5 text-primary" />
              {workflow.automationBlueprint.length} automated
            </div>
            <div className="ml-auto flex items-center gap-5">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Per run</p>
                <p className="text-sm font-bold text-emerald-400">−{totalSavedTimeMinutes}m saved</p>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Automation</p>
                <p className="text-sm font-bold text-primary">{efficiencyPct}% automated</p>
              </div>
            </div>
          </div>

          <FlowchartVisualizer workflow={workflow} />
        </motion.div>

      </div>
    </div>
  );
}
