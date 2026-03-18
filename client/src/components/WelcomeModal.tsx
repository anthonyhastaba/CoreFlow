import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeModalProps {
  open: boolean;
  onGenerateClick: () => void;
  onDemoClick: () => void;
}

const STEPS = [
  {
    name: "Describe your process",
    description: "Type any repetitive workflow in plain English.",
  },
  {
    name: "Get your blueprint",
    description: "AI generates a complete automation plan with tool recommendations.",
  },
  {
    name: "Measure your ROI",
    description: "See exactly how much time and money you'll save.",
  },
];

export default function WelcomeModal({ open, onGenerateClick, onDemoClick }: WelcomeModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md bg-background border border-border/60"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Cpu className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-display font-bold">
              <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome to CoreFlow
              </span>
            </DialogTitle>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            You're 30 seconds away from your first automation blueprint.
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold leading-snug">{step.name}</p>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={onGenerateClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
          >
            Generate My First Blueprint
          </Button>
          <Button
            variant="outline"
            onClick={onDemoClick}
            className="w-full rounded-xl border-border/60 font-semibold"
          >
            Explore Demo Workflows
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
