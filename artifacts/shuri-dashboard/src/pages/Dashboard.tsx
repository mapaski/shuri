import { useDashboardData } from "@/hooks/use-dashboard";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartsView } from "@/components/dashboard/ChartsView";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function Dashboard() {
  const { data, isLoading, isError } = useDashboardData();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader2 size={40} className="animate-spin drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
          <p className="text-sm font-medium animate-pulse text-muted-foreground">Initializing SHURI core...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="glass-panel p-8 text-center rounded-2xl border-destructive/20 max-w-md">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4 border border-destructive/20">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">System Error</h2>
          <p className="text-muted-foreground">Failed to establish connection to telemetry streams. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time telemetry and operational metrics.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {data.kpis.map((kpi, index) => (
          <KPICard key={kpi.title} data={kpi} index={index} />
        ))}
      </div>

      <ChartsView data={data.chartData} />
      
      <ActivityFeed activities={data.activities} />
    </div>
  );
}
