import { Bell, Search, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

const pageTitles: Record<string, { title: string; sub: string }> = {
  "/": { title: "Network Map", sub: "Live topology of connected IoT devices" },
  "/network-map": { title: "Network Map", sub: "Live topology of connected IoT devices" },
  "/device-list": { title: "Device List", sub: "All registered IoT endpoints" },
  "/alerts": { title: "Alerts", sub: "Active security incidents and warnings" },
  "/heatmap": { title: "Heatmap", sub: "CVSS × Blast Radius risk tile matrix + traffic analytics" },
  "/compliance": { title: "Compliance", sub: "OWASP IoT Top 10 coverage and remediation status" },
};

export default function Header() {
  const [location] = useLocation();
  const page = pageTitles[location] ?? { title: "SHURI", sub: "IoT Security Dashboard" };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{page.title}</h1>
        <p className="text-xs text-muted-foreground">{page.sub}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground w-56">
          <Search size={14} />
          <span>Search devices...</span>
        </div>

        <button className="relative p-2 rounded-lg border border-border hover:border-primary/50 hover:text-primary text-muted-foreground transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive border border-background" />
        </button>

        <button className="p-2 rounded-lg border border-border hover:border-primary/50 hover:text-primary text-muted-foreground transition-colors">
          <RefreshCw size={16} />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">A</div>
          <span className="text-sm text-foreground font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
}
