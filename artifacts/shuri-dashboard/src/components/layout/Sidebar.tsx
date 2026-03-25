import { Link, useLocation } from "wouter";
import { LayoutDashboard, LineChart, FileText, Settings, Shield, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/security", label: "Security", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="h-screen sticky top-0 border-r border-white/[0.05] bg-sidebar flex flex-col z-20 transition-all duration-300 ease-in-out"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3 overflow-hidden">
          <img 
            src={`${import.meta.env.BASE_URL}images/logo.png`} 
            alt="SHURI Logo" 
            className="w-8 h-8 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] shrink-0" 
          />
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="font-display font-bold text-xl tracking-wide bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent whitespace-nowrap"
            >
              SHURI
            </motion.span>
          )}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors absolute -right-3 bg-sidebar border border-white/[0.05] shadow-md"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto">
        <div className="mb-2 px-3">
          {!collapsed && <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Main Menu</p>}
        </div>
        
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-xl border border-primary/20 z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-center">
                  <item.icon size={20} className={cn(
                    "transition-transform duration-300",
                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "group-hover:scale-110"
                  )} />
                </div>
                {!collapsed && (
                  <span className={cn(
                    "relative z-10 font-medium whitespace-nowrap transition-colors",
                    isActive ? "text-primary-foreground" : ""
                  )}>
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/[0.05]">
        <div className="glass-panel p-3 rounded-xl flex items-center gap-3 relative overflow-hidden group cursor-pointer hover:border-white/10 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <Bell size={20} className="text-sidebar-foreground group-hover:text-accent transition-colors" />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-destructive border border-sidebar shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
          </div>
          {!collapsed && (
            <div className="relative z-10">
              <p className="text-sm font-medium text-sidebar-accent-foreground">Notifications</p>
              <p className="text-xs text-sidebar-foreground">3 unread</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
