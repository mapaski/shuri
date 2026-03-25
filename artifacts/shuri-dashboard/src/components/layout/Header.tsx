import { Search, Command, Zap } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";

export function Header() {
  const { data: health } = useHealthCheck();

  return (
    <header className="h-16 glass-header sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="flex-1 flex items-center gap-4">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search commands, metrics, users..." 
            className="w-full bg-black/20 border border-white/[0.05] rounded-full py-2 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground border border-white/10">
            <Command size={10} /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs font-medium bg-black/20 px-3 py-1.5 rounded-full border border-white/[0.05]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-muted-foreground uppercase tracking-wider">API Status:</span>
          <span className="text-foreground">{health?.status === "ok" ? "Healthy" : "Checking..."}</span>
        </div>

        <button className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300 transform hover:-translate-y-0.5">
          <Zap size={16} className="fill-current" />
          Quick Action
        </button>

        <div className="h-8 w-px bg-white/[0.05]" />

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Admin User</p>
            <p className="text-xs text-muted-foreground">Engineering</p>
          </div>
          <div className="relative">
            <img 
              src={`${import.meta.env.BASE_URL}images/avatar.png`} 
              alt="User avatar" 
              className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover group-hover:border-primary transition-colors shadow-lg"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
