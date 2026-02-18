import { Card } from "@/components/ui/card";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      <Card className="p-6 bg-card border-border/50 hover:border-primary/40 transition-all duration-300 relative overflow-hidden group card-top-accent hover:shadow-[0_0_30px_-12px_rgba(139,92,246,0.25)]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-display font-bold tracking-tight text-foreground">
                {value}
              </h3>
              {trendValue && (
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                    trend === "up"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : trend === "down"
                      ? "text-rose-400 bg-rose-500/10"
                      : "text-muted-foreground bg-secondary/50"
                  }`}
                >
                  {trend === "up" ? "↑" : trend === "down" ? "↓" : "·"} {trendValue}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground/50">{subtitle}</p>
            )}
          </div>

          {icon && (
            <div className={`p-3 rounded-xl text-primary transition-all duration-300 ${
              trend === "up"
                ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15"
                : trend === "down"
                ? "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/15"
                : "bg-primary/10 group-hover:bg-primary/15"
            }`}>
              {icon}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
