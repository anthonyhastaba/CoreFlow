import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useWorkflow } from "@/hooks/use-workflows";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  AlertCircle,
  Crown,
  Check,
  Sparkles,
  Users,
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
      <div className={`text-right text-lg font-display tabular-nums ${tied ? tieClass : aWins ? winClass : loseClass}`}>
        {aWins && !tied && <Trophy className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />}
        {row.format(row.valueA)}
      </div>
      <div className="flex flex-col items-center gap-1 min-w-[120px]">
        <div className="flex items-center gap-1.5 text-muted-foreground/60">
          <span className="w-3.5 h-3.5">{row.icon}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 text-center leading-tight">
          {row.label}
        </span>
        {tied && <Minus className="w-3 h-3 text-muted-foreground/30" />}
      </div>
      <div className={`text-left text-lg font-display tabular-nums ${tied ? tieClass : bWins ? winClass : loseClass}`}>
        {row.format(row.valueB)}
        {bWins && !tied && <Trophy className="w-3.5 h-3.5 inline ml-1.5 text-emerald-400" />}
      </div>
    </motion.div>
  );
}

// ─── Plan feature list ────────────────────────────────────────────────────────
function PlanFeatures({ features }: { features: string[] }) {
  return (
    <ul className="space-y-3">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          {f}
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const { user } = useUser();

  // Pricing modal
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Waitlist modal
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  // Pre-populate email when user loads
  useEffect(() => {
    if (user?.emailAddresses[0]?.emailAddress) {
      setWaitlistEmail(user.emailAddresses[0].emailAddress);
    }
  }, [user]);

  const handleSubscribe = () => {
    setShowPricingModal(false);
    setWaitlistSuccess(false);
    setShowWaitlistModal(true);
  };

  const handleJoinWaitlist = () => {
    setWaitlistSuccess(true);
    setTimeout(() => {
      setShowWaitlistModal(false);
      setWaitlistSuccess(false);
    }, 2000);
  };

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
    <>
      {/* ── Pricing modal ── */}
      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent className="max-w-2xl bg-background border border-border/60 p-0 overflow-hidden">
          <style>{`
            @keyframes shimmer {
              0%   { transform: translateX(-100%) skewX(-15deg); }
              100% { transform: translateX(250%) skewX(-15deg); }
            }
            .shimmer-btn::after {
              content: '';
              position: absolute;
              inset-y: 0;
              width: 40%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
              animation: shimmer 2.2s ease-in-out infinite;
            }
          `}</style>
          <div className="p-6 border-b border-border/50">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} />
                <DialogTitle className="font-display text-xl">Choose your plan</DialogTitle>
              </div>
              <DialogDescription className="text-muted-foreground text-sm">
                Unlock unlimited AI blueprints, advanced analytics, and powerful team tools.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid grid-cols-2 gap-0 divide-x divide-border/50 border-t border-border/30">
            {/* Pro plan */}
            <div className="p-6 space-y-5 ring-1 ring-primary/25 shadow-[0_0_28px_-10px_rgba(139,92,246,0.4)]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                    Most Popular
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    Pro
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold">$20</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-1">Ideal for freelancers &amp; solo builders</p>
              </div>
              <PlanFeatures features={[
                "Unlimited AI blueprint generation",
                "Side-by-side workflow comparison",
                "Advanced ROI analytics",
                "Priority email support",
                "Export to PDF and CSV",
              ]} />
              <Button
                onClick={handleSubscribe}
                className="w-full rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_16px_-4px_rgba(139,92,246,0.45)]"
              >
                Subscribe
              </Button>
            </div>

            {/* Team plan */}
            <div className="p-6 space-y-5 bg-amber-500/[0.04] border-l border-amber-500/10 relative">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Team
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold">$80</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <p className="text-xs text-amber-400/70 mt-1">Best for growing teams</p>
              </div>
              <PlanFeatures features={[
                "Everything in Pro",
                "Team workspace with shared library",
                "Role-based access control",
                "API access for custom integrations",
                "Dedicated account manager",
                "Custom onboarding session",
              ]} />
              <div className="relative overflow-hidden rounded-xl">
                <Button
                  onClick={handleSubscribe}
                  className="shimmer-btn w-full rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)] relative overflow-hidden"
                >
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
          <div className="px-6 py-3 border-t border-border/30 text-center">
            <p className="text-xs text-muted-foreground/50">No credit card required to start. Cancel anytime.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Waitlist modal ── */}
      <Dialog open={showWaitlistModal} onOpenChange={(open) => { if (!open && !waitlistSuccess) setShowWaitlistModal(false); }}>
        <DialogContent className="max-w-sm bg-background border border-border/60">
          {waitlistSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Check className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <p className="font-display font-bold text-lg">You're on the list!</p>
                <p className="text-sm text-muted-foreground mt-1">We'll be in touch soon.</p>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <DialogTitle className="font-display">You're almost there</DialogTitle>
                </div>
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  CoreFlow Pro is currently in early access. Join the waitlist and we'll reach out when your spot is ready.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-1">
                <Input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-secondary/40 border-border/60 focus-visible:ring-primary/30"
                />
                <Button
                  onClick={handleJoinWaitlist}
                  disabled={!waitlistEmail.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-[0_0_16px_-4px_rgba(139,92,246,0.4)]"
                >
                  Join Waitlist
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Page ── */}
      <div className="flex-1 overflow-y-auto dot-grid-bg relative">
        <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-primary/6 rounded-full blur-[180px] pointer-events-none -z-10" />

        {/* Compare content — blurred behind overlay */}
        <div className="blur-sm pointer-events-none select-none">
          <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
            <div>
              <Button variant="ghost" className="gap-2 text-muted-foreground -ml-2 rounded-xl">
                <ArrowLeft className="w-4 h-4" /> Back to Library
              </Button>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                <Trophy className="w-3.5 h-3.5" /> Blueprint Comparison
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">Compare Blueprints</h1>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-4">
              <div className={`p-5 rounded-2xl border bg-card/50 ${overallWinner === "A" ? "border-emerald-500/30" : "border-border/50"}`}>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold mb-2">Blueprint A</p>
                <p className="font-display font-bold text-lg">{workflowA.name}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{aWinsCount} of {rows.length} metrics</p>
              </div>
              <div className="flex items-center justify-center w-12">
                <span className="text-sm font-bold text-muted-foreground/30 font-display">VS</span>
              </div>
              <div className={`p-5 rounded-2xl border bg-card/50 ${overallWinner === "B" ? "border-emerald-500/30" : "border-border/50"}`}>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold mb-2">Blueprint B</p>
                <p className="font-display font-bold text-lg">{workflowB.name}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{bWinsCount} of {rows.length} metrics</p>
              </div>
            </div>

            <div className="space-y-2">
              {rows.map((row, i) => (
                <CompareRowItem key={row.label} row={row} delay={0} />
              ))}
            </div>
          </div>
        </div>

        {/* Pro upgrade overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/40 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-5 text-center max-w-md px-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_36px_-6px_rgba(245,158,11,0.35)]">
                <Crown className="w-7 h-7 text-amber-400" />
              </div>
              <span className="absolute -top-2 -right-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-sm">
                Pro
              </span>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-2xl font-display font-bold leading-tight">
                Unlock Advanced Workflow Comparison
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Compare workflows side-by-side, identify the highest ROI automations, and export detailed comparison reports.
              </p>
              <p className="text-sm font-semibold text-amber-400">Starting at $20/month</p>
            </div>

            <Button
              onClick={() => setShowPricingModal(true)}
              className="rounded-xl px-8 h-11 font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_24px_-4px_rgba(245,158,11,0.5)] transition-all duration-200 gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
