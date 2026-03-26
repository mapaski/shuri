import { useLocation } from "wouter";
import {
  Network,
  Cpu,
  AlertTriangle,
  Activity,
  FileText,
  Shield,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Network Map", icon: Network, href: "/network-map" },
  { label: "Device List", icon: Cpu, href: "/device-list" },
  { label: "Alerts", icon: AlertTriangle, href: "/alerts" },
  { label: "Heatmap", icon: Activity, href: "/heatmap" },
  { label: "Report", icon: FileText, href: "/report" },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();

  const isActive = (href: string) => {
    if (href === "/network-map" && (location === "/" || location === "/network-map")) return true;
    return location === href;
  };

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center purple-glow-sm">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-foreground tracking-wide text-sm">SHURI</span>
          <p className="text-xs text-muted-foreground leading-none mt-0.5">IoT Security</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3">Navigation</p>
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = isActive(href);
          return (
            <button
              key={href}
              onClick={() => navigate(href)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${active
                  ? "bg-primary/15 text-primary border border-primary/30 purple-glow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent"
                }
              `}
            >
              <Icon size={17} className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"} />
              <span className="flex-1 text-left">{label}</span>
              {active && <ChevronRight size={14} className="text-primary" />}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/30">
          <span className="w-2 h-2 rounded-full status-dot-online animate-pulse" />
          <span className="text-xs text-muted-foreground">System Online</span>
        </div>
      </div>
    </aside>
  );
}
