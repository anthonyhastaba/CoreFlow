import { useWorkflow } from "@/hooks/use-workflows";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Trophy,
  Minus,
  ExternalLink,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CompareRow {
  label: string;
  icon: React.ReactNode;
  valueA: number;
  valueB: number;
  higherIsBetter: boolean;
  format: (v: number) => string;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function CompareSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8 animate-pulse">
        <div className="h-8 w-40 bg-secondary/60 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-secondary/40 rounded-2xl" />
          <div className="h-20 bg-secondary/40 rounded-2xl" />
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-secondary/30 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────
function CompareRowItem({ row, delay }: { row: CompareRow; delay: number }) {
  const aWins = row.higherIsBetter ? row.valueA > row.valueB : row.valueA < row.valueB;
  const bWins = row.higherIsBetter ? row.valueB > row.valueA : row.valueB < row.valueA;
  const tied = row.valueA === row.valueB;

  const winClass = "text-emerald-400 font-bold";
  const loseClass = "text-muted-foreground";
  const tieClass = "text-foreground font-semibold";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4 rounded-xl bg-secondary/20 border border-border/30"
    >
      {/* A value */}
      <div className={`text-right text-lg font-display tabular-nums ${tied ? tieClass : aWins ? winClass : loseClass}`}>
        {aWins && !tied && <Trophy className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />}
        {row.format(row.valueA)}
      </div>

      {/* Metric label */}
      <div className="flex flex-col items-center gap-1 min-w-[120px]">
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <span className="w-3.5 h-3.5">{row.icon}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 text-center leading-tight">
          {row.label}
        </span>
        {tied && <Minus className="w-3 h-3 text-muted-foreground/30" />}
      </div>

      {/* B value */}
      <div className={`text-left text-lg font-display tabular-nums ${tied ? tieClass : bWins ? winClass : loseClass}`}>
        {row.format(row.valueB)}
        {bWins && !tied && <Trophy className="w-3.5 h-3.5 inline ml-1.5 text-emerald-400" />}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const params = new URLSearchParams(window.location.search);
  const idA = parseInt(params.get("a") || "0", 10) || null;
  const idB = parseInt(params.get("b") || "0", 10) || null;

  const { data: workflowA, isLoading: loadingA } = useWorkflow(idA);
  const { data: workflowB, isLoading: loadingB } = useWorkflow(idB);

  if (loadingA || loadingB) return <CompareSkeleton />;

  if (!workflowA || !workflowB || !idA || !idB) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-muted-foreground">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm">Could not load both workflows for comparison.</p>
        <Link href="/library">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Button>
        </Link>
      </div>
    );
  }

  const hourlyCostA = (workflowA as any).hourlyCost || 35;
  const hourlyCostB = (workflowB as any).hourlyCost || 35;
  const netSavingsA = Math.round(workflowA.timeSavedYearly * hourlyCostA - (workflowA.toolCostAnnual || 0));
  const netSavingsB = Math.round(workflowB.timeSavedYearly * hourlyCostB - (workflowB.toolCostAnnual || 0));

  const rows: CompareRow[] = [
    {
      label: "Priority Score",
      icon: <Target className="w-3.5 h-3.5" />,
      valueA: workflowA.priorityScore,
      valueB: workflowB.priorityScore,
      higherIsBetter: true,
      format: (v) => `${v}/100`,
    },
    {
      label: "Time Saved Weekly",
      icon: <Clock className="w-3.5 h-3.5" />,
      valueA: workflowA.timeSavedWeekly,
      valueB: workflowB.timeSavedWeekly,
      higherIsBetter: true,
      format: (v) => `${v}h`,
    },
    {
      label: "Time Saved Yearly",
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      valueA: workflowA.timeSavedYearly,
      valueB: workflowB.timeSavedYearly,
      higherIsBetter: true,
      format: (v) => `${v}h`,
    },
    {
      label: "Tool Cost Annual",
      icon: <DollarSign className="w-3.5 h-3.5" />,
      valueA: workflowA.toolCostAnnual || 0,
      valueB: workflowB.toolCostAnnual || 0,
      higherIsBetter: false,
      format: (v) => `$${v.toLocaleString()}`,
    },
    {
      label: "Net Annual Savings",
      icon: <DollarSign className="w-3.5 h-3.5" />,
      valueA: netSavingsA,
      valueB: netSavingsB,
      higherIsBetter: true,
      format: (v) => `$${v.toLocaleString()}`,
    },
    {
      label: "Steps Automated",
      icon: <Zap className="w-3.5 h-3.5" />,
      valueA: workflowA.automationBlueprint.length,
      valueB: workflowB.automationBlueprint.length,
      higherIsBetter: true,
      format: (v) => `${v}`,
    },
  ];

  const aWinsCount = rows.filter((r) => r.higherIsBetter ? r.valueA > r.valueB : r.valueA < r.valueB).length;
  const bWinsCount = rows.filter((r) => r.higherIsBetter ? r.valueB > r.valueA : r.valueB < r.valueA).length;
  const overallWinner = aWinsCount > bWinsCount ? "A" : bWinsCount > aWinsCount ? "B" : null;

  return (
    <div className="flex-1 overflow-y-auto dot-grid-bg">
      <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-primary/6 rounded-full blur-[180px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">

        {/* Back nav */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <Link href="/library">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground -ml-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            <Trophy className="w-3.5 h-3.5" />
            Blueprint Comparison
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Compare Blueprints</h1>
        </motion.div>

        {/* Workflow name headers */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4"
        >
          {/* A */}
          <div className={`p-5 rounded-2xl border bg-card/50 backdrop-blur-sm relative overflow-hidden ${overallWinner === "A" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50"}`}>
            {overallWinner === "A" && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                <Trophy className="w-3 h-3" /> Winner
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold mb-2">Blueprint A</p>
            <p className="font-display font-bold text-lg leading-snug pr-16">{workflowA.name}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{aWinsCount} of {rows.length} metrics</p>
          </div>

          {/* VS divider */}
          <div className="flex items-center justify-center w-12">
            <span className="text-sm font-bold text-muted-foreground/30 font-display">VS</span>
          </div>

          {/* B */}
          <div className={`p-5 rounded-2xl border bg-card/50 backdrop-blur-sm relative overflow-hidden ${overallWinner === "B" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50"}`}>
            {overallWinner === "B" && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                <Trophy className="w-3 h-3" /> Winner
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold mb-2">Blueprint B</p>
            <p className="font-display font-bold text-lg leading-snug pr-16">{workflowB.name}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{bWinsCount} of {rows.length} metrics</p>
          </div>
        </motion.div>

        {/* Comparison rows */}
        <div className="space-y-2">
          {rows.map((row, i) => (
            <CompareRowItem key={row.label} row={row} delay={0.15 + i * 0.06} />
          ))}
        </div>

        {/* View full links */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40"
        >
          <Link href={`/workflow/${idA}`}>
            <Button variant="ghost" className="w-full gap-2 border border-border/50 hover:border-primary/30 hover:text-primary rounded-xl text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              Open Blueprint A
            </Button>
          </Link>
          <Link href={`/workflow/${idB}`}>
            <Button variant="ghost" className="w-full gap-2 border border-border/50 hover:border-primary/30 hover:text-primary rounded-xl text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
              Open Blueprint B
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
