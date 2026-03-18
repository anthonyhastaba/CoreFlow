import { useState, useRef, useEffect } from "react";
import { useCreateWorkflow, useWorkflows, useSeedDemos } from "@/hooks/use-workflows";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Cpu, ArrowRight, AlertCircle, X, Info, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@clerk/clerk-react";
import WelcomeModal from "@/components/WelcomeModal";

const EXAMPLES = [
  {
    label: "Monthly invoicing",
    description:
      "Every month I export all unpaid invoices from QuickBooks as a CSV, open it in Excel, remove already-paid entries manually, then copy each client's name, address, and amount into a Word invoice template to create individual PDFs. I email each one manually through Gmail, log the send date in a shared Google Sheet, then follow up 7 days later if still unpaid. We have around 40 clients and this entire process takes a full day each month.",
  },
  {
    label: "Lead qualification & CRM",
    description:
      "Every morning our sales team reviews new inbound leads from our website contact form. Someone manually copies each lead's name, email, company, and message into Salesforce CRM, then looks up the company on LinkedIn to assess size and industry. Based on that, they categorize the lead as Hot, Warm, or Cold in a spreadsheet and assign it to a rep via Slack message. We get 30–50 leads a day and this takes about two hours every morning.",
  },
  {
    label: "Social media reporting",
    description:
      "Every Friday our marketing coordinator logs into Instagram, LinkedIn, Facebook, and Twitter separately to screenshot this week's analytics. She pastes the numbers into a Google Sheet template, writes a brief summary paragraph, then formats it into a PowerPoint deck for the Monday all-hands. Data collection alone takes 3 hours and deck formatting takes another 2 hours — every single week.",
  },
  {
    label: "Employee onboarding",
    description:
      "When a new hire starts, our HR manager manually creates accounts in Google Workspace, Slack, Notion, and Asana. She emails IT to set up the laptop, emails the hiring manager to schedule a first-week agenda, fills out a paper I-9 and scans it, then creates an onboarding checklist in Google Docs and shares it with the new employee. Each onboarding takes 4–5 hours spread across the first week and we hire 2–3 people per month.",
  },
];

export default function GeneratePage() {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [accessKeyError, setAccessKeyError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const createMutation = useCreateWorkflow();
  const seedDemosMutation = useSeedDemos();
  const { data: workflows, isLoading: workflowsLoading } = useWorkflows();
  const [, setLocation] = useLocation();
  const { user } = useUser();

  const showEmptyState = !workflowsLoading && (workflows?.length ?? 0) === 0 && !showForm && !createMutation.isPending;
  const cancelledRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("prefill");
    if (prefill) {
      setDescription(decodeURIComponent(prefill));
      setIsPrefilled(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const key = `coreflow_welcomed_${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowWelcomeModal(true);
      localStorage.setItem(key, "true");
    }
  }, [user?.id]);

  const runGeneration = () => {
    setError(null);
    cancelledRef.current = false;
    createMutation.mutate(
      { description },
      {
        onSuccess: (data) => {
          if (!cancelledRef.current) {
            setLocation(`/workflow/${data.id}`);
          }
        },
        onError: (err: any) =>
          setError(err.message || "Failed to generate workflow. Please try again."),
      }
    );
  };

  const handleGenerate = () => {
    if (!description.trim()) return;
    const validated = localStorage.getItem(`coreflow_access_validated_${user?.id}`);
    if (!validated) {
      setShowAccessModal(true);
      return;
    }
    runGeneration();
  };

  const handleAccessKeySubmit = () => {
    if (accessKey === "DEMO123") {
      localStorage.setItem(`coreflow_access_validated_${user?.id}`, "true");
      setShowAccessModal(false);
      runGeneration();
    } else {
      setAccessKeyError(true);
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    createMutation.reset();
  };

  const handleWelcomeGenerate = () => {
    setShowWelcomeModal(false);
    setShowForm(true);
    setTimeout(() => textareaRef.current?.focus(), 300);
  };

  const handleWelcomeDemo = () => {
    setShowWelcomeModal(false);
    seedDemosMutation.mutate();
  };

  return (
    <>
    <WelcomeModal
      open={showWelcomeModal}
      onGenerateClick={handleWelcomeGenerate}
      onDemoClick={handleWelcomeDemo}
    />
    <Dialog open={showAccessModal} onOpenChange={(open) => { setShowAccessModal(open); if (!open) { setAccessKey(""); setAccessKeyError(false); } }}>
      <DialogContent className="max-w-sm bg-background border border-border/60">
        <DialogHeader>
          <DialogTitle className="font-display">Enter access key</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <Input
            value={accessKey}
            onChange={(e) => { setAccessKey(e.target.value); setAccessKeyError(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleAccessKeySubmit(); }}
            placeholder="XXXXXXX"
            className="bg-secondary/40 border-border/60 focus-visible:ring-primary/30"
          />
          {accessKeyError && (
            <p className="text-xs text-destructive">Invalid access key</p>
          )}
          <p className="text-xs text-muted-foreground">
            Don't have one?{" "}
            <span className="text-muted-foreground/60 cursor-default">Request access key</span>
          </p>
          <Button
            onClick={handleAccessKeySubmit}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden dot-grid-bg">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[160px] pointer-events-none -z-10" />

      <AnimatePresence mode="wait">
        {showEmptyState ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md relative z-10 text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 220, damping: 18 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_40px_-6px_rgba(139,92,246,0.6)] mx-auto"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>

            <div className="space-y-3">
              <h2 className="text-3xl font-display font-bold tracking-tight">
                Your workflow library is empty
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Generate your first automation blueprint or explore demo workflows to see what CoreFlow can do.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => setShowForm(true)}
                className="rounded-xl px-6 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-4px_rgba(139,92,246,0.55)] transition-all duration-200 gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Create Automation
              </Button>
              <Button
                variant="outline"
                onClick={() => seedDemosMutation.mutate()}
                disabled={seedDemosMutation.isPending}
                className="rounded-xl px-6 font-semibold border-border/60 hover:border-primary/40 hover:bg-secondary/50 transition-all duration-200 gap-2"
              >
                {seedDemosMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Load Demo Workflows
              </Button>
            </div>
          </motion.div>
        ) : !createMutation.isPending ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl relative z-10 space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-5">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 220, damping: 18 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_36px_-6px_rgba(139,92,246,0.55)]"
              >
                <Cpu className="w-7 h-7" />
              </motion.div>

              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight leading-[1.05]">
                  Describe your
                  <br />
                  <span className="text-gradient glow-primary-text">manual process</span>
                </h1>
                <p className="text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Our AI breaks it into steps and builds a complete automation blueprint with tool picks and ROI projections.
                </p>
              </div>
            </div>

            {/* Input */}
            <div className="space-y-3">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-destructive/10 border-destructive/20 animate-in fade-in slide-in-from-top-4"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Analysis Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isPrefilled && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs"
                >
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Pre-filled from existing workflow · Edit and regenerate below</span>
                  <button
                    className="ml-auto hover:text-white transition-colors"
                    onClick={() => setIsPrefilled(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}

              <div className="relative group">
                {/* Glow ring on focus */}
                <div className="absolute -inset-px bg-gradient-to-r from-primary/40 via-indigo-500/20 to-primary/40 rounded-2xl blur-sm opacity-40 group-focus-within:opacity-80 transition-opacity duration-500 pointer-events-none" />

                <div className="relative bg-secondary/40 rounded-2xl border border-border/60 backdrop-blur-sm overflow-hidden group-focus-within:border-primary/40 transition-colors duration-300">
                  <Textarea
                    ref={textareaRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                    }}
                    placeholder="E.g., Every morning I download the CSV report from Salesforce, open it in Excel, filter rows where status is 'Closed', and email the results to the marketing team..."
                    className="w-full h-44 resize-none bg-transparent border-0 text-base p-5 pb-3 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/35 leading-relaxed"
                  />
                  {/* Bottom bar */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-secondary/20">
                    <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                      {description.length > 0
                        ? `${description.length} characters`
                        : "Cmd+Enter to generate"}
                    </span>
                    <Button
                      size="sm"
                      onClick={handleGenerate}
                      disabled={!description.trim()}
                      className="rounded-xl px-5 h-8 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-4px_rgba(139,92,246,0.55)] transition-all duration-200 gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick examples */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs text-muted-foreground/40 shrink-0">Try:</span>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => {
                      setDescription(ex.description);
                      setIsPrefilled(false);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary/40 hover:bg-primary/10 border border-border/50 hover:border-primary/30 text-muted-foreground/70 hover:text-primary transition-all duration-200 font-medium"
                  >
                    <span className="mr-1 opacity-50">→</span>{ex.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading-state"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-sm text-center space-y-10"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-2 border-primary/10 rounded-full" />
              <div className="absolute inset-0 border-2 border-primary/70 rounded-full border-t-transparent animate-spin" />
              <div
                className="absolute inset-2.5 border border-indigo-400/30 rounded-full border-b-transparent animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "1.8s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>

            <div className="space-y-5">
              <h2 className="text-2xl font-display font-bold">Analyzing Process...</h2>
              <div className="space-y-2.5 max-w-xs mx-auto text-left">
                {[
                  "Deconstructing manual steps",
                  "Identifying automation opportunities",
                  "Selecting optimal tools",
                  "Calculating ROI and priority",
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.8, duration: 0.4 }}
                    className="flex items-center gap-3 text-muted-foreground text-sm"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    <span>{text}...</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleCancel}
              className="gap-2 text-muted-foreground hover:text-foreground border border-border/50 hover:border-border hover:bg-secondary/50 rounded-xl px-6"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
