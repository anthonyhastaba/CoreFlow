import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { FlowchartVisualizer } from "@/components/FlowchartVisualizer";
import {
  Clock, TrendingUp, Zap, Target, AlertCircle, DollarSign,
  WorkflowIcon, CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SharedReportSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-14 border-b border-border/50 bg-background/80" />
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 animate-pulse">
        <div className="space-y-4">
          <div className="h-6 w-40 bg-secondary/60 rounded-full" />
          <div className="h-12 w-2/3 bg-secondary/60 rounded-xl" />
          <div className="space-y-2 pl-4 border-l-2 border-secondary/40">
            <div className="h-4 w-full bg-secondary/40 rounded" />
            <div className="h-4 w-4/5 bg-secondary/40 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-secondary/30 rounded-xl border border-border/40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="h-96 bg-secondary/30 rounded-2xl border border-border/40" />
          <div className="h-96 bg-secondary/30 rounded-2xl border border-border/40" />
        </div>
      </div>
    </div>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function StatChip({
  label,
  value,
  icon,
  color = "primary",
  delay = 0,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: "primary" | "green" | "blue" | "indigo";
  delay?: number;
}) {
  const colors = {
    primary: "bg-primary/10 border-primary/20 text-primary",
    green:   "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    blue:    "bg-blue-500/10 border-blue-500/20 text-blue-400",
    indigo:  "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`rounded-xl border p-4 ${colors[color]}`}
    >
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon}<span className="text-[10px] font-bold uppercase tracking-widest">{label}</span></div>
      <p className="text-2xl font-display font-bold">{value}</p>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SharedReportPage() {
  const [, params] = useRoute("/shared/:shareId");
  const shareId = params?.shareId;

  const { data: workflow, isLoading, error } = useQuery<any>({
    queryKey: [buildUrl(api.workflows.getShared.path, { shareId: shareId || "" })],
    enabled: !!shareId,
  });

  if (isLoading) return <SharedReportSkeleton />;

  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4 text-muted-foreground">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-display font-semibold text-foreground">Report not found</h2>
        <p className="text-sm">This shared report may have been removed or the link is invalid.</p>
      </div>
    );
  }

  const currentRuns = workflow.runsPerWeek || 5;
  const currentHourlyCost = workflow.hourlyCost || 35;
  const totalManualTimeMinutes = workflow.originalProcess.reduce((acc: number, step: any) => acc + step.timeSpentMinutes, 0);
  const totalSavedTimeMinutes = workflow.automationBlueprint.reduce((acc: number, step: any) => acc + step.timeSavedMinutes, 0);
  const annualManualCost = Math.round((totalManualTimeMinutes / 60) * currentHourlyCost * currentRuns * 52);
  const annualSavings = Math.round((totalSavedTimeMinutes / 60) * currentHourlyCost * currentRuns * 52);
  const toolCost = Math.round(workflow.toolCostAnnual || 0);
  const netFirstYearSavings = annualManualCost - toolCost;
  const fiveYearROI = toolCost > 0
    ? (((annualManualCost * 5 - toolCost * 5) / (toolCost * 5)) * 100).toFixed(0)
    : "100";
  const monthlySavings = annualSavings / 12;
  const paybackMonths = monthlySavings > 0 ? (toolCost / monthlySavings).toFixed(1) : "0";
  const isSavingPositive = netFirstYearSavings > 0;
  const efficiencyPct = Math.round((totalSavedTimeMinutes / Math.max(totalManualTimeMinutes, 1)) * 100);

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground dot-grid-bg selection:bg-primary/30">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[200px] pointer-events-none -z-10" />

      {/* Sticky nav */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_-2px_rgba(139,92,246,0.6)]">
              <WorkflowIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">CoreFlow</span>
            <span className="text-border mx-1.5 font-light">·</span>
            <span className="text-sm text-muted-foreground">Automation Report</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <CalendarDays className="w-3.5 h-3.5" />
            {new Date(workflow.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <Zap className="w-4 h-4" />
            Automation Blueprint
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-bold leading-tight">
            {workflow.name}
          </h1>
          {/* Callout description */}
          <div className="max-w-3xl flex gap-4">
            <div className="w-0.5 bg-gradient-to-b from-primary/60 via-primary/20 to-transparent rounded-full shrink-0" />
            <p className="text-lg text-muted-foreground leading-relaxed">{workflow.description}</p>
          </div>
        </motion.div>

        {/* Key stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatChip
            label="Net 1st Year Savings"
            value={`$${Math.abs(netFirstYearSavings).toLocaleString()}`}
            icon={<DollarSign className="w-3.5 h-3.5" />}
            color={isSavingPositive ? "green" : "primary"}
            delay={0.1}
          />
          <StatChip
            label="5 Year ROI"
            value={isSavingPositive ? `${fiveYearROI}%` : "N/A"}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            color="indigo"
            delay={0.15}
          />
          <StatChip
            label="Hours Saved / Year"
            value={`${workflow.timeSavedYearly}h`}
            icon={<Clock className="w-3.5 h-3.5" />}
            color="blue"
            delay={0.2}
          />
          <StatChip
            label="Priority Score"
            value={`${workflow.priorityScore}/100`}
            icon={<Target className="w-3.5 h-3.5" />}
            color="primary"
            delay={0.25}
          />
        </div>

        {/* ROI summary bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
        >
          <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border/40">
            <div className="p-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Annual Manual Cost</p>
              <p className="text-2xl font-display font-bold">${annualManualCost.toLocaleString()}</p>
            </div>
            <div className="p-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Annual Tool Cost</p>
              <p className="text-2xl font-display font-bold">${toolCost.toLocaleString()}</p>
            </div>
            <div className={`p-5 md:col-span-1 relative overflow-hidden ${isSavingPositive ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
              <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${isSavingPositive ? "from-emerald-500/20" : "from-amber-500/20"} to-transparent pointer-events-none`} />
              <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 relative ${isSavingPositive ? "text-emerald-500/70" : "text-amber-500/70"}`}>Net 1st Year Savings</p>
              <p className={`text-2xl font-display font-bold relative ${isSavingPositive ? "text-emerald-400 glow-green-text" : "text-amber-400"}`}>
                ${Math.abs(netFirstYearSavings).toLocaleString()}
              </p>
            </div>
            <div className="p-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Payback Period</p>
              <p className="text-2xl font-display font-bold">{isSavingPositive ? `${paybackMonths} mo` : "N/A"}</p>
            </div>
            <div className="p-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">5 Year ROI</p>
              <p className={`text-2xl font-display font-bold ${isSavingPositive ? "text-emerald-400" : "text-muted-foreground"}`}>
                {isSavingPositive ? `${fiveYearROI}%` : "N/A"}
              </p>
            </div>
          </div>
          {/* Automation coverage bar */}
          <div className="px-5 py-3 border-t border-border/40 flex items-center gap-4">
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold shrink-0">Automation Coverage</span>
            <div className="flex-1 h-1 bg-secondary/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${efficiencyPct}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400"
              />
            </div>
            <span className="text-xs font-bold text-primary shrink-0">{efficiencyPct}%</span>
          </div>
        </motion.div>

        {/* Full-width flowchart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-display font-bold">Process Architecture</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60 px-2.5 py-1 rounded-lg bg-secondary/40 border border-border/40">
              <span className="font-mono">{workflow.originalProcess.length}</span> steps
              <span className="text-primary font-bold">→</span>
              <span className="font-mono text-primary">{workflow.automationBlueprint.length}</span> automated
            </div>
          </div>
          <FlowchartVisualizer workflow={workflow} />
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="relative rounded-2xl border border-primary/25 overflow-hidden px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent pointer-events-none" />
          <div className="absolute inset-0 dot-grid-bg opacity-20 pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-foreground text-lg leading-snug">
                Want your own automation blueprint?
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Generate a free analysis for any manual process →
              </p>
            </div>
          </div>
          <Link href="/" className="relative shrink-0">
            <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-[0_0_20px_-6px_rgba(139,92,246,0.6)]">
              Try CoreFlow
              <span className="text-primary-foreground/70">→</span>
            </button>
          </Link>
        </motion.div>

        {/* Footer */}
        <footer className="border-t border-border/40 pt-8 flex items-center justify-between text-xs text-muted-foreground/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary/20 flex items-center justify-center">
              <WorkflowIcon className="w-3 h-3 text-primary" />
            </div>
            <span className="font-medium text-muted-foreground/70">CoreFlow Automation Engine</span>
          </div>
          <span>Confidential & Proprietary</span>
        </footer>
      </div>
    </div>
  );
}
