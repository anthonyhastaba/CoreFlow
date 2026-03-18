import { SignUp } from "@clerk/clerk-react";

const clerkAppearance = {
  variables: {
    colorPrimary: "#7c6aff",
    colorBackground: "#0f172a",
    colorInputBackground: "#1e293b",
    colorInputText: "#f8fafc",
    colorText: "#f8fafc",
    colorTextSecondary: "#94a3b8",
    colorNeutral: "#334155",
    borderRadius: "0.5rem",
    fontFamily: "Inter, sans-serif",
  },
  elements: {
    card: "shadow-2xl border border-white/10",
    formButtonPrimary:
      "bg-primary hover:opacity-90 text-primary-foreground font-semibold",
    footerActionLink: "text-primary hover:text-primary/80",
    headerTitle: "text-foreground font-display font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton: "border border-white/10 bg-secondary hover:bg-secondary/80 text-foreground",
    dividerLine: "bg-white/10",
    dividerText: "text-muted-foreground",
    formFieldLabel: "text-foreground/80",
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden dot-grid-bg">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
          CoreFlow
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          AI-powered workflow automation
        </p>
      </div>
      <SignUp
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
