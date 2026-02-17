import { useState } from "react";
import { motion } from "framer-motion";
import { Workflow, automatedStepSchema, stepSchema } from "@shared/schema";
import { ArrowRight, ArrowDown, Settings, Zap, Clock, Box, ShieldAlert } from "lucide-react";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";

type Step = z.infer<typeof stepSchema>;
type AutoStep = z.infer<typeof automatedStepSchema>;

interface FlowchartVisualizerProps {
  workflow: Workflow;
}

export function FlowchartVisualizer({ workflow }: FlowchartVisualizerProps) {
  const manualSteps = workflow.originalProcess as Step[];
  const autoSteps = workflow.automationBlueprint as AutoStep[];
  const [expandedManual, setExpandedManual] = useState<string | null>(null);
  const [expandedAuto, setExpandedAuto] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
  };

  if (isMobile) {
    return (
      <div className="w-full">
        <div className="rounded-2xl border border-border/50 overflow-hidden bg-secondary/10">
          {/* Mobile column header */}
          <div className="px-4 py-3 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Box className="w-3.5 h-3.5" />
              Manual
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-primary/40" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Automated
            </span>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="divide-y divide-border/30"
          >
            {manualSteps.map((manualStep, index) => {
              const autoStep =
                autoSteps.find((a) => a.originalStepId === manualStep.id) || autoSteps[index];
              const isManualExpanded = expandedManual === manualStep.id;
              const isAutoExpanded = autoStep ? expandedAuto === autoStep.id : false;
              const stepNum = String(index + 1).padStart(2, "0");

              return (
                <motion.div key={manualStep.id} variants={item} className="p-4 space-y-3">
                  <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest font-mono">
                    Step {stepNum}
                  </div>

                  {/* Manual step */}
                  <div
                    className="rounded-xl border border-border/50 bg-card/40 hover:border-muted-foreground/30 hover:bg-secondary/30 transition-all duration-200 cursor-pointer"
                    onClick={() => setExpandedManual(isManualExpanded ? null : manualStep.id)}
                  >
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h5 className="font-semibold text-foreground text-sm leading-snug">
                          {manualStep.name}
                        </h5>
                        <span className="flex items-center shrink-0 text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-md border border-border/50">
                          <Clock className="w-3 h-3 mr-1" />
                          {manualStep.timeSpentMinutes}m
                        </span>
                      </div>
                      <p className={`text-xs text-muted-foreground leading-relaxed transition-all duration-300 ${isManualExpanded ? "" : "line-clamp-2"}`}>
                        {manualStep.description}
                      </p>
                    </div>
                    <div className="px-4 pb-2.5 text-[10px] text-muted-foreground/30 hover:text-primary/50 transition-colors font-medium tracking-wide">
                      {isManualExpanded ? "▲ Collapse" : "▼ Expand"}
                    </div>
                  </div>

                  {/* Arrow down */}
                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/15 to-indigo-500/15 border border-primary/20 flex items-center justify-center shadow-[0_0_12px_-4px_rgba(139,92,246,0.3)]">
                      <ArrowDown className="w-3.5 h-3.5 text-primary/60" />
                    </div>
                  </div>

                  {/* Auto step */}
                  {autoStep ? (
                    <div
                      className="rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/8 transition-all duration-200 cursor-pointer shadow-[0_0_20px_-8px_rgba(139,92,246,0.2)]"
                      onClick={() => setExpandedAuto(isAutoExpanded ? null : autoStep.id)}
                    >
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h5 className="font-semibold text-primary text-sm leading-snug">
                            {autoStep.name}
                          </h5>
                          <span className="flex items-center shrink-0 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                            −{autoStep.timeSavedMinutes}m
                          </span>
                        </div>
                        <p className={`text-xs text-muted-foreground leading-relaxed mb-3 transition-all duration-300 ${isAutoExpanded ? "" : "line-clamp-2"}`}>
                          {autoStep.description}
                        </p>
                        <div className="flex items-center gap-1.5 w-fit text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                          <Settings className="w-3 h-3" />
                          {autoStep.toolUsed}
                        </div>
                      </div>
                      <div className="px-4 pb-2.5 text-[10px] text-muted-foreground/30 hover:text-primary/50 transition-colors font-medium tracking-wide">
                        {isAutoExpanded ? "▲ Collapse" : "▼ Expand"}
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[80px] border-2 border-dashed border-border/30 rounded-xl flex items-center justify-center p-4 opacity-40">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Remains Manual
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[820px] rounded-2xl border border-border/50 overflow-hidden bg-secondary/10">

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_72px_1fr] border-b border-border/50 bg-secondary/30">
          <div className="px-6 py-4 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-muted-foreground/10 flex items-center justify-center">
              <Box className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Manual Process
            </span>
          </div>
          <div className="border-x border-border/50" />
          <div className="px-6 py-4 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
              Automated Blueprint
            </span>
          </div>
        </div>

        {/* Step rows */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="divide-y divide-border/30"
        >
          {manualSteps.map((manualStep, index) => {
            const autoStep =
              autoSteps.find((a) => a.originalStepId === manualStep.id) || autoSteps[index];
            const isManualExpanded = expandedManual === manualStep.id;
            const isAutoExpanded = autoStep ? expandedAuto === autoStep.id : false;
            const stepNum = String(index + 1).padStart(2, "0");

            return (
              <motion.div
                key={manualStep.id}
                variants={item}
                className="grid grid-cols-[1fr_72px_1fr]"
              >
                {/* Manual step */}
                <div className="p-4">
                  <div
                    className="group rounded-xl border border-border/50 bg-card/40 hover:border-muted-foreground/30 hover:bg-secondary/30 transition-all duration-200 cursor-pointer"
                    onClick={() =>
                      setExpandedManual(isManualExpanded ? null : manualStep.id)
                    }
                  >
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground/30 font-mono mt-0.5 shrink-0 leading-none">
                            {stepNum}
                          </span>
                          <h5 className="font-semibold text-foreground text-sm leading-snug">
                            {manualStep.name}
                          </h5>
                        </div>
                        <span className="flex items-center shrink-0 text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-md border border-border/50">
                          <Clock className="w-3 h-3 mr-1" />
                          {manualStep.timeSpentMinutes}m
                        </span>
                      </div>
                      <p
                        className={`text-xs text-muted-foreground leading-relaxed transition-all duration-300 ${
                          isManualExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {manualStep.description}
                      </p>
                    </div>
                    <div className="px-4 pb-2.5 text-[10px] text-muted-foreground/30 group-hover:text-primary/50 transition-colors font-medium tracking-wide">
                      {isManualExpanded ? "▲ Collapse" : "▼ Expand"}
                    </div>
                  </div>
                </div>

                {/* Connector */}
                <div className="flex items-center justify-center border-x border-border/30 bg-secondary/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/15 to-indigo-500/15 border border-primary/20 flex items-center justify-center shadow-[0_0_12px_-4px_rgba(139,92,246,0.3)]">
                    <ArrowRight className="w-3.5 h-3.5 text-primary/60" />
                  </div>
                </div>

                {/* Automated step */}
                <div className="p-4">
                  {autoStep ? (
                    <div
                      className="group rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/8 transition-all duration-200 cursor-pointer shadow-[0_0_20px_-8px_rgba(139,92,246,0.2)]"
                      onClick={() =>
                        setExpandedAuto(isAutoExpanded ? null : autoStep.id)
                      }
                    >
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-primary/25 font-mono mt-0.5 shrink-0 leading-none">
                              {stepNum}
                            </span>
                            <h5 className="font-semibold text-primary text-sm leading-snug">
                              {autoStep.name}
                            </h5>
                          </div>
                          <span className="flex items-center shrink-0 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                            −{autoStep.timeSavedMinutes}m
                          </span>
                        </div>
                        <p
                          className={`text-xs text-muted-foreground leading-relaxed mb-3 transition-all duration-300 ${
                            isAutoExpanded ? "" : "line-clamp-2"
                          }`}
                        >
                          {autoStep.description}
                        </p>
                        <div className="flex items-center gap-1.5 w-fit text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                          <Settings className="w-3 h-3" />
                          {autoStep.toolUsed}
                        </div>
                      </div>
                      <div className="px-4 pb-2.5 text-[10px] text-muted-foreground/30 group-hover:text-primary/50 transition-colors font-medium tracking-wide">
                        {isAutoExpanded ? "▲ Collapse" : "▼ Expand"}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[80px] border-2 border-dashed border-border/30 rounded-xl flex items-center justify-center p-4 opacity-40">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Remains Manual
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
