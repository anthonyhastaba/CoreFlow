import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Cpu,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import {
  motion,
  useInView,
  Variants,
} from "framer-motion";
import { useRef, useEffect } from "react";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: "~43m",  label: "Saved per process run" },
  { value: "86%",   label: "Automation rate" },
  { value: "1 mo",  label: "Typical payback period" },
  { value: "< 30s", label: "Per blueprint" },
];

const steps = [
  {
    n: "01",
    title: "Describe your process",
    desc: "Write a plain-English description of any repetitive workflow — no technical jargon required.",
  },
  {
    n: "02",
    title: "Get your blueprint + ROI",
    desc: "CoreFlow generates a structured automation blueprint with time savings, cost projections, and a priority score in seconds.",
  },
  {
    n: "03",
    title: "Implement and optimize",
    desc: "Save blueprints to your library, share with your team, and track ROI as you roll out automations.",
  },
];

const deliverables = [
  {
    number: "01",
    title: "Automation steps",
    desc: "A numbered, plain-English sequence — trigger, actions, conditions — ready to hand off to an engineer or drop into your no-code tool.",
    accent: "text-violet-400",
  },
  {
    number: "02",
    title: "ROI projection",
    desc: "Time saved per week, monthly cost savings in dollars, and estimated payback period — calculated from your team size and hourly rate.",
    accent: "text-emerald-400",
  },
  {
    number: "03",
    title: "Priority score",
    desc: "A 0–100 ranking based on automation potential, effort, and business impact. Sort your backlog by what will actually move the needle.",
    accent: "text-sky-400",
  },
  {
    number: "04",
    title: "Shareable report",
    desc: "One link. Anyone can view the blueprint, compare workflows, or export — no account required to read.",
    accent: "text-amber-400",
  },
];

const blueprintSteps = [
  "Trigger: New customer signs contract in CRM",
  "Auto-send welcome email sequence (Day 0, 3, 7)",
  "Create onboarding tasks in project management tool",
  "Schedule kickoff call via calendar integration",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationId: number;
    let time = 0;

    const resolveColor = (variables: string[], alpha = 1) => {
      const root = getComputedStyle(document.documentElement);
      const el = document.createElement("div");
      el.style.cssText = "position:absolute;visibility:hidden;width:1px;height:1px";
      document.body.appendChild(el);
      let color = `rgba(255,255,255,${alpha})`;
      for (const v of variables) {
        if (!root.getPropertyValue(v).trim()) continue;
        el.style.backgroundColor = `var(${v})`;
        const c = getComputedStyle(el).backgroundColor;
        if (c && c !== "rgba(0, 0, 0, 0)") {
          const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          color = m ? `rgba(${m[1]},${m[2]},${m[3]},${alpha})` : c;
          break;
        }
      }
      document.body.removeChild(el);
      return color;
    };

    const getColors = () => ({
      waves: [
        { offset: 0,              amplitude: 60, frequency: 0.003,  color: resolveColor(["--primary"], 0.7), opacity: 0.4 },
        { offset: Math.PI / 2,   amplitude: 80, frequency: 0.0026, color: resolveColor(["--accent","--primary"], 0.6), opacity: 0.3 },
        { offset: Math.PI,       amplitude: 50, frequency: 0.0034, color: resolveColor(["--secondary","--foreground"], 0.5), opacity: 0.25 },
        { offset: Math.PI * 1.5, amplitude: 70, frequency: 0.0022, color: resolveColor(["--primary"], 0.3), opacity: 0.2 },
      ],
    });

    let colors = getColors();
    const observer = new MutationObserver(() => { colors = getColors(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const influence = prefersReduced ? 10 : 60;
    const radius = prefersReduced ? 160 : 280;
    const smooth = prefersReduced ? 0.04 : 0.1;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const c = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = c; targetMouseRef.current = c;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { targetMouseRef.current = { x: e.clientX, y: e.clientY }; });

    const animate = () => {
      time += 1;
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * smooth;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * smooth;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const wave of colors.waves) {
        ctx.save();
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 4) {
          const dx = x - mouseRef.current.x;
          const dy = canvas.height / 2 - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const inf = Math.max(0, 1 - dist / radius) * influence * Math.sin(time * 0.001 + x * 0.01 + wave.offset);
          const y = canvas.height / 2
            + Math.sin(x * wave.frequency + time * 0.002 + wave.offset) * wave.amplitude
            + Math.sin(x * wave.frequency * 0.4 + time * 0.003) * (wave.amplitude * 0.4)
            + inf;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = wave.color;
        ctx.globalAlpha = wave.opacity;
        ctx.shadowBlur = 30;
        ctx.shadowColor = wave.color;
        ctx.stroke();
        ctx.restore();
      }
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />;
}

function PulseRing() {
  return (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[1, 2].map((i) => (
        <span
          key={i}
          className="absolute rounded-full border border-primary/30"
          style={{
            width: `${i * 44 + 32}px`,
            height: `${i * 44 + 32}px`,
            animation: `pulse-ring ${1.8 + i * 0.6}s ease-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function BlueprintCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-md w-full mx-auto"
    >
      {/* Glow behind card */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-indigo-500/10 to-transparent blur-xl" />

      <div className="relative card-top-accent rounded-2xl border border-border/60 bg-secondary/40 backdrop-blur-sm p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">
              Generated Blueprint
            </p>
            <h3 className="font-display font-semibold text-foreground text-base leading-snug">
              Customer Onboarding Automation
            </h3>
          </div>
          <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25">
            Priority 94/100
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Automation potential</span>
            <span className="text-foreground font-medium">94%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400"
              initial={{ width: 0 }}
              whileInView={{ width: "94%" }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">Time saved</span>
            </div>
            <p className="font-display font-bold text-lg text-emerald-300">14h / week</p>
          </div>
          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-indigo-400 font-medium">Cost savings</span>
            </div>
            <p className="font-display font-bold text-lg text-indigo-300">$8,400/mo</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Automation steps
          </p>
          {blueprintSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.1 });

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      {/* Global pulse-ring keyframe */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);    opacity: 0.6; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>

      {/* Ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/8 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/4 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-[200px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-1/4 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[180px] pointer-events-none -z-10" />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 py-4 border-b border-border/30 bg-background/70 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_16px_-4px_rgba(139,92,246,0.7)]">
            <Cpu className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            CoreFlow
          </span>
        </div>
        <Link href="/sign-in">
          <Button
            variant="ghost"
            className="border border-border/50 hover:border-primary/40 hover:bg-primary/5 text-foreground rounded-xl px-5 transition-all duration-200"
          >
            Sign In
          </Button>
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center pt-24 pb-16 px-6 text-center">
        <HeroCanvas />
        <motion.div
          className="relative z-10 max-w-3xl space-y-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border border-primary/30 bg-primary/8 text-primary backdrop-blur-sm">
              <span className="text-base leading-none">✦</span>
              Blueprint in under 30 seconds
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={fadeUp} className="space-y-2 relative">
            {/* Pulse rings behind hero icon */}
            <div className="flex justify-center mb-6">
              <div className="relative flex items-center justify-center">
                <PulseRing />
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_32px_-8px_rgba(139,92,246,0.6)]">
                  <Cpu className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>

            <h1 className="text-6xl md:text-7xl font-display font-bold tracking-tight leading-[1.02] text-foreground">
              Automate your workflows
              <br />
              <span className="text-gradient glow-primary-text">with AI</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            Describe any repetitive business process in plain English. CoreFlow generates a complete
            automation blueprint with ROI projections in under 30 seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Link href="/sign-up">
              <Button className="rounded-xl px-7 h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_28px_-4px_rgba(139,92,246,0.6)] hover:shadow-[0_0_36px_-4px_rgba(139,92,246,0.75)] transition-all duration-200 gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() =>
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-xl px-7 h-11 border border-border/50 hover:border-primary/30 hover:bg-primary/5 text-foreground transition-all duration-200"
            >
              See how it works
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-12 px-6">
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-border/40 bg-border/20"
          variants={staggerContainer}
          initial="hidden"
          animate={statsInView ? "visible" : "hidden"}
        >
          {stats.map(({ value, label }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className="flex flex-col items-center justify-center py-8 px-4 text-center bg-secondary/20 hover:bg-secondary/40 transition-colors duration-200"
            >
              <span className="font-display font-bold text-3xl md:text-4xl text-foreground tabular-nums">
                {value}
              </span>
              <span className="text-xs text-muted-foreground mt-1.5 leading-snug">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Product Preview ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Sample output
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              See what a blueprint looks like
            </h2>
          </motion.div>
          <BlueprintCard />
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Three steps
            </h2>
          </motion.div>

          <motion.div
            className="relative flex flex-col gap-0"
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {/* Vertical connecting line */}
            <div className="absolute left-[22px] md:left-1/2 md:-translate-x-px top-12 bottom-12 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent pointer-events-none" />

            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                variants={fadeUp}
                className={`relative flex items-start gap-6 md:gap-0 pb-12 last:pb-0 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Number circle */}
                <div className="shrink-0 z-10 w-11 h-11 rounded-full bg-secondary border border-primary/40 flex items-center justify-center shadow-[0_0_20px_-6px_rgba(139,92,246,0.5)] md:absolute md:left-1/2 md:-translate-x-1/2">
                  <span className="font-display font-bold text-xs text-primary">{step.n}</span>
                </div>

                {/* Content */}
                <div
                  className={`flex-1 md:max-w-[42%] ${
                    i % 2 === 0
                      ? "md:pr-16 md:text-right"
                      : "md:pl-16 md:ml-auto"
                  }`}
                >
                  <div className="bg-secondary/25 border border-border/40 rounded-2xl p-5 hover:border-primary/25 hover:bg-secondary/40 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2 md:justify-end">
                      <ChevronRight className="w-3.5 h-3.5 text-primary" />
                      <h3 className="font-display font-semibold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── What You Get ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Every blueprint includes
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Four things. Every time.
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {deliverables.map(({ number, title, desc, accent }) => (
              <motion.div
                key={number}
                variants={fadeUp}
                className="group flex gap-5 p-6 rounded-2xl border border-border/40 bg-secondary/20 hover:border-primary/25 hover:bg-secondary/35 transition-all duration-300"
              >
                <span className={`font-display font-bold text-4xl ${accent} opacity-30 group-hover:opacity-55 transition-opacity shrink-0 leading-none mt-1 select-none`}>
                  {number}
                </span>
                <div className="space-y-2">
                  <h3 className="font-display font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Bottom CTA Banner ────────────────────────────────────────────────── */}
      <section className="py-4 px-6 pb-16">
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 24 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 text-center shadow-[0_0_80px_-20px_rgba(139,92,246,0.5)]"
        >
          {/* Internal glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <div className="relative z-10 space-y-5">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Stop doing it manually.
            </h2>
            <p className="text-indigo-100/80 text-base max-w-md mx-auto leading-relaxed">
              Describe any repetitive process. Get a complete automation blueprint with ROI projections in under 30 seconds.
            </p>
            <Link href="/sign-up">
              <Button className="rounded-xl px-8 h-12 font-semibold bg-white text-indigo-700 hover:bg-white/90 shadow-xl transition-all duration-200 gap-2 mt-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/30 px-6 md:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-3 h-3 text-primary" />
          </div>
          <span className="font-display font-semibold text-sm text-foreground">CoreFlow</span>
        </div>
        <p className="text-xs text-muted-foreground">© 2025 CoreFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
