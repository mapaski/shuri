import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type KPIData } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

interface KPICardProps {
  data: KPIData;
  index: number;
}

export function KPICard({ data, index }: KPICardProps) {
  const isPositive = data.trend === "up";
  const isNeutral = data.trend === "neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      className="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
    >
      {/* Subtle hover gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-col justify-between h-full">
        <h3 className="text-muted-foreground font-medium text-sm tracking-wide uppercase">
          {data.title}
        </h3>
        
        <div className="mt-4 flex items-end justify-between">
          <div className="text-3xl font-display font-bold text-foreground drop-shadow-sm tracking-tight">
            {data.value}
          </div>
          
          <div className={cn(
            "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-md",
            isPositive ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20" :
            isNeutral ? "text-muted-foreground bg-white/5 border border-white/10" :
            "text-destructive bg-destructive/10 border border-destructive/20"
          )}>
            {isPositive ? <TrendingUp size={14} /> : isNeutral ? <Minus size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(data.change)}%</span>
          </div>
        </div>
        
        <p className="mt-4 text-xs text-muted-foreground/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
          {data.metric}
        </p>
      </div>
      
      {/* Decorative tech line */}
      <div className="absolute top-0 right-0 w-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}
