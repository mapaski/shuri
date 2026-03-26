import { useLocation } from "wouter";
import { Shield } from "lucide-react";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Shield size={48} className="text-primary mb-4 opacity-50" />
      <h1 className="text-2xl font-bold text-foreground mb-2">404 — Page Not Found</h1>
      <p className="text-muted-foreground mb-6 text-sm">This route doesn't exist in the SHURI system.</p>
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/25 transition-colors"
      >
        Return to Network Map
      </button>
    </div>
  );
}
