import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, LayoutGrid, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden dot-grid-bg" style={{ minHeight: "100%" }}>
      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[200px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-500/6 rounded-full blur-[160px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 px-6"
      >
        {/* Big 404 */}
        <motion.h1
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 20 }}
          className="text-[9rem] md:text-[13rem] font-display font-bold leading-none select-none bg-gradient-to-br from-primary via-indigo-400 to-primary/50 bg-clip-text text-transparent"
          style={{ textShadow: "none" }}
        >
          404
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed text-sm">
            This page doesn't exist or has been moved. Head back to start building automation blueprints.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 justify-center flex-wrap"
        >
          <Link href="/">
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-4px_rgba(139,92,246,0.55)] rounded-xl px-6">
              <Home className="w-4 h-4" />
              Go Home
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/library">
            <Button
              variant="ghost"
              className="gap-2 border border-border/50 hover:border-border hover:bg-secondary/50 rounded-xl px-6 text-muted-foreground hover:text-foreground"
            >
              <LayoutGrid className="w-4 h-4" />
              View Library
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
