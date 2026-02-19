import { useState } from "react";
import { useWorkflows } from "@/hooks/use-workflows";
import { useWorkflowStatus } from "@/hooks/use-workflow-status";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  TrendingUp,
  Calendar,
  DollarSign,
  LayoutGrid,
  Sparkles,
  Plus,
  Search,
  ArrowRight,
  Check,
  X,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/50 p-6 bg-card/50 space-y-4 animate-pulse">
      <div className="flex justify-between items-start gap-4">
        <div className="h-5 bg-secondary/60 rounded-lg w-2/3" />
        <div className="h-6 w-10 bg-secondary/60 rounded-lg" />
      </div>
      <div className="h-3 bg-secondary/40 rounded w-1/3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-secondary/40 rounded-xl" />
        <div className="h-16 bg-secondary/40 rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <div className="h-2 bg-secondary/30 rounded-full w-full" />
      </div>
      <div className="h-9 bg-secondary/50 rounded-xl" />
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_META = {
  planned:       { label: "Planned",     dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-500/10   border-amber-500/20"   },
  "in-progress": { label: "In Progress", dot: "bg-blue-400",    text: "text-blue-400",    bg: "bg-blue-500/10    border-blue-500/20"    },
  live:          { label: "Live",        dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

function StatusBadge({ status }: { status: "planned" | "in-progress" | "live" }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${m.bg} ${m.text}`}>
      {status === "live" ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${m.dot} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${m.dot}`} />
        </span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      )}
      {m.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const { data: workflows, isLoading } = useWorkflows();
  const { getStatus, statuses } = useWorkflowStatus();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score" | "savings">("date");
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const getSavings = (wf: NonNullable<typeof workflows>[number]) => {
    const hourlyRate = (wf as any).hourlyCost || 35;
    return Math.round(wf.timeSavedYearly * hourlyRate - (wf.toolCostAnnual || 0));
  };

  const filteredWorkflows = [...(workflows || [])]
    .filter((wf) => wf.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "date")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "score") return b.priorityScore - a.priorityScore;
      if (sortBy === "savings") return getSavings(b) - getSavings(a);
      return 0;
    });

  const totalWorkflows = workflows?.length || 0;
  const totalHoursSaved = workflows?.reduce((acc, wf) => acc + wf.timeSavedYearly, 0) || 0;
  const totalCostSavings =
    workflows?.reduce((acc, wf) => acc + getSavings(wf), 0) || 0;
  const averageROI = workflows?.length
    ? workflows.reduce((acc, wf) => {
        const hourlyRate = (wf as any).hourlyCost || 35;
        const annualSavings = wf.timeSavedYearly * hourlyRate;
        const toolCost = wf.toolCostAnnual || 1;
        return acc + ((annualSavings * 5 - toolCost * 5) / (toolCost * 5)) * 100;
      }, 0) / workflows.length
    : 0;

  // Status breakdown counts
  const statusCounts = {
    planned: 0,
    "in-progress": 0,
    live: 0,
  };
  if (workflows) {
    for (const wf of workflows) {
      statusCounts[getStatus(wf.id)]++;
    }
  }

  const toggleCompare = (id: number) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev
    );
  };

  const sortButtons: { key: typeof sortBy; label: string }[] = [
    { key: "date", label: "Date" },
    { key: "score", label: "Score" },
    { key: "savings", label: "Savings" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden border border-border/50 px-8 py-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/40 to-background" />
          <div className="absolute inset-0 dot-grid-bg opacity-35" />

          <div className="relative flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 mb-4">
                <LayoutGrid className="w-3.5 h-3.5" />
                Automation Portfolio
              </div>
              <h1 className="text-5xl font-display font-bold leading-none">
                {isLoading ? (
                  <span className="inline-block h-12 w-16 bg-secondary/50 rounded-xl animate-pulse" />
                ) : (
                  totalWorkflows
                )}
                <span className="text-muted-foreground font-normal text-3xl ml-3">blueprints</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Track and analyze your complete automation portfolio.
              </p>

              {/* Status breakdown pills */}
              {!isLoading && totalWorkflows > 0 && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {statusCounts.planned} Planned
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {statusCounts["in-progress"]} In Progress
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </span>
                    {statusCounts.live} Live
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-right">
                {isLoading ? (
                  <div className="h-9 w-28 bg-secondary/50 rounded-xl animate-pulse mb-1" />
                ) : (
                  <p className="text-3xl font-display font-bold text-emerald-400">
                    ${totalCostSavings.toLocaleString()}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5 flex items-center gap-1 justify-end">
                  <DollarSign className="w-3 h-3" /> Annual savings
                </p>
              </div>
              <div className="h-12 w-px bg-border/50 hidden md:block" />
              <div className="text-right">
                {isLoading ? (
                  <div className="h-9 w-20 bg-secondary/50 rounded-xl animate-pulse mb-1" />
                ) : (
                  <p className="text-3xl font-display font-bold text-primary">
                    {totalHoursSaved}h
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3" /> Hours reclaimed
                </p>
              </div>
              <div className="h-12 w-px bg-border/50 hidden md:block" />
              <div className="text-right">
                {isLoading ? (
                  <div className="h-9 w-20 bg-secondary/50 rounded-xl animate-pulse mb-1" />
                ) : (
                  <p className="text-3xl font-display font-bold text-indigo-300">
                    {averageROI.toFixed(0)}%
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3 h-3" /> Avg 5yr ROI
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search + Sort bar */}
        {!isLoading && totalWorkflows > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
              <Input
                placeholder="Search blueprints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/30 border-border/50 focus:border-primary/40 rounded-xl h-9 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 bg-secondary/30 border border-border/50 rounded-xl p-1">
              {sortButtons.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                    sortBy === key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {search && (
              <span className="text-xs text-muted-foreground/60 shrink-0">
                {filteredWorkflows.length} of {totalWorkflows}
              </span>
            )}
          </motion.div>
        )}

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
            : filteredWorkflows.length === 0 && search
            ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-3 flex flex-col items-center justify-center py-24 text-center space-y-4"
                >
                  <Search className="w-10 h-10 text-muted-foreground/20" />
                  <div>
                    <h3 className="text-lg font-display font-bold mb-1">No matches found</h3>
                    <p className="text-muted-foreground text-sm">
                      No blueprints match "<span className="text-foreground">{search}</span>"
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground"
                    onClick={() => setSearch("")}
                  >
                    <X className="w-4 h-4" /> Clear search
                  </Button>
                </motion.div>
              )
            : workflows?.length === 0
            ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-3 flex flex-col items-center justify-center py-28 text-center space-y-5"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_-8px_rgba(139,92,246,0.4)]">
                    <Sparkles className="w-7 h-7 text-primary/60" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold mb-2">No blueprints yet</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      Describe a manual process on the Generate page and your first automation blueprint will appear here.
                    </p>
                  </div>
                  <Link href="/">
                    <Button className="mt-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 gap-2">
                      <Plus className="w-4 h-4" />
                      Create your first blueprint
                    </Button>
                  </Link>
                </motion.div>
              )
            : filteredWorkflows.map((wf, idx) => {
                const netSavings = getSavings(wf);
                const isSelected = compareIds.includes(wf.id);
                const isDisabled = compareIds.length >= 2 && !isSelected;
                const status = getStatus(wf.id);

                return (
                  <motion.div
                    key={wf.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * idx }}
                    className="relative"
                  >
                    {/* Comparison toggle */}
                    <button
                      onClick={() => toggleCompare(wf.id)}
                      disabled={isDisabled}
                      title={isDisabled ? "Deselect one to pick this" : isSelected ? "Remove from comparison" : "Add to comparison"}
                      className={`absolute top-3 right-3 z-20 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : isDisabled
                          ? "border-border/30 bg-background/40 opacity-25 cursor-not-allowed"
                          : "border-border/60 bg-background/70 opacity-50 hover:opacity-100 hover:border-primary/60 hover:bg-background"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>

                    <Card
                      className={`group hover-elevate bg-card/50 h-full flex flex-col card-top-accent overflow-hidden relative transition-all duration-300 ${
                        isSelected
                          ? "border-primary/40 shadow-[0_0_30px_-10px_rgba(139,92,246,0.35)]"
                          : "border-border/60 hover:border-primary/20 hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.2)]"
                      }`}
                      style={{ overflow: "visible" }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-4 pr-6">
                          <CardTitle className="text-lg font-display group-hover:text-primary transition-colors leading-snug">
                            {wf.name}
                          </CardTitle>
                          <div className="shrink-0 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-lg border border-primary/15">
                            {wf.priorityScore}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(wf.createdAt), "MMM d, yyyy")}
                          </div>
                          <StatusBadge status={status} />
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Weekly</p>
                            <p className="text-xl font-display font-bold text-primary">{wf.timeSavedWeekly}h</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">saved</p>
                          </div>
                          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest mb-1">Annual</p>
                            <p className="text-xl font-display font-bold text-emerald-400">${netSavings.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-0.5">net savings</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase text-muted-foreground/60 font-bold tracking-widest">Priority Score</span>
                            <span className="text-[10px] font-bold text-muted-foreground/60">{wf.priorityScore}/100</span>
                          </div>
                          <div className="h-1 bg-secondary/60 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${wf.priorityScore}%` }}
                              transition={{ duration: 0.9, delay: 0.15 + 0.06 * idx, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400"
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Link href={`/workflow/${wf.id}`} className="w-full">
                          <Button
                            variant="secondary"
                            className="w-full gap-2 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors duration-200"
                          >
                            View Analysis
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
        </div>
      </div>

      {/* Floating compare bar */}
      <AnimatePresence>
        {compareIds.length === 2 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-[0_8px_40px_-8px_rgba(139,92,246,0.4)] px-5 py-3.5 flex items-center gap-4"
          >
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Compare</span>
              <span className="text-primary font-bold">2</span>
              <span className="text-muted-foreground">blueprints</span>
            </div>
            <Button
              onClick={() => setLocation(`/compare?a=${compareIds[0]}&b=${compareIds[1]}`)}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 h-8 text-sm shadow-[0_0_16px_-4px_rgba(139,92,246,0.6)]"
            >
              Compare
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <button
              onClick={() => setCompareIds([])}
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
