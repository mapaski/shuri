import { Bell, Search, RefreshCw, LogOut, Settings, User, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { useScanData } from "@/hooks/use-scan-data";
import { useDeviceDrawer } from "@/context/device-drawer-context";

const pageTitles: Record<string, { title: string; sub: string }> = {
  "/": { title: "Network Map", sub: "Live topology of connected IoT devices" },
  "/network-map": { title: "Network Map", sub: "Live topology of connected IoT devices" },
  "/device-list": { title: "Device List", sub: "All registered IoT endpoints" },
  "/alerts": { title: "Alerts", sub: "Active security incidents and warnings" },
  "/heatmap": { title: "Heatmap", sub: "CVSS × Blast Radius risk tile matrix + traffic analytics" },
  "/compliance": { title: "Compliance", sub: "OWASP IoT Top 10 coverage and remediation status" },
  "/remediation": { title: "Remediation", sub: "IoT Security Dashboard" },
};

const riskColor: Record<string, string> = {
  CRITICAL: "text-red-400", HIGH: "text-orange-400",
  MEDIUM: "text-amber-400", LOW: "text-emerald-400",
};

export default function Header() {
  const [location, navigate] = useLocation();
  const [showAdmin, setShowAdmin] = useState(false);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { data } = useScanData();
  const { openDrawer } = useDeviceDrawer();
  const searchRef = useRef<HTMLDivElement>(null);
  const page = pageTitles[location] ?? { title: "SHURI", sub: "IoT Security Dashboard" };

  const results = query.length > 1
    ? (data?.devices || []).filter(d =>
        d.hostname?.toLowerCase().includes(query.toLowerCase()) ||
        d.ip?.includes(query) ||
        d.device_type?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{page.title}</h1>
        <p className="text-xs text-muted-foreground">{page.sub}</p>
      </div>

      <div className="flex items-center gap-3">
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground w-56 focus-within:border-primary/50 transition-colors">
            <Search size={14} className="flex-shrink-0" />
            <input
              type="text"
              placeholder="Search devices..."
              value={query}
              onChange={e => { setQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground w-full text-sm"
            />
            {query && (
              <button onClick={() => { setQuery(""); setShowResults(false); }}>
                <X size={12} className="hover:text-foreground" />
              </button>
            )}
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute top-11 left-0 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              {results.map(device => (
                <button
                  key={device.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left border-b border-border/50 last:border-0"
                  onClick={() => { openDrawer(device); setQuery(""); setShowResults(false); }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{device.hostname}</p>
                    <p className="text-xs text-muted-foreground font-mono">{device.ip} · {device.device_type}</p>
                  </div>
                  <span className={`text-xs font-semibold ${riskColor[device.risk_level] ?? "text-muted-foreground"}`}>
                    {device.risk_level}
                  </span>
                </button>
              ))}
            </div>
          )}
          {showResults && query.length > 1 && results.length === 0 && (
            <div className="absolute top-11 left-0 w-72 bg-card border border-border rounded-xl shadow-xl z-50 px-4 py-3 text-sm text-muted-foreground">
              No devices found for "{query}"
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/alerts")}
          className="relative p-2 rounded-lg border border-border hover:border-primary/50 hover:text-primary text-muted-foreground transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive border border-background" />
        </button>

        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-lg border border-border hover:border-primary/50 hover:text-primary text-muted-foreground transition-colors"
        >
          <RefreshCw size={16} />
        </button>

        <div className="relative flex items-center gap-2 pl-3 border-l border-border">
          <button onClick={() => setShowAdmin(v => !v)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">A</div>
            <span className="text-sm text-foreground font-medium">Admin</span>
          </button>
          {showAdmin && (
            <div className="absolute right-0 top-10 w-44 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-semibold text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">SHURI Operator</p>
              </div>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors">
                <User size={13} /> Profile
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors">
                <Settings size={13} /> Settings
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
