import { motion } from "framer-motion";
import { Activity } from "@/hooks/use-dashboard";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="glass-panel rounded-2xl overflow-hidden mt-6"
    >
      <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-bold text-foreground">System Activity</h3>
          <p className="text-sm text-muted-foreground">Recent events and operations</p>
        </div>
        <button className="text-sm text-primary hover:text-primary-foreground transition-colors font-medium">
          View All
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/[0.05]">
            <tr>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">User / System</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Target</th>
              <th className="px-6 py-4 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <motion.tr 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + (index * 0.1) }}
                key={activity.id} 
                className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {activity.status === 'success' && <CheckCircle2 size={16} className="text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                    {activity.status === 'failed' && <XCircle size={16} className="text-destructive drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />}
                    {activity.status === 'pending' && <Clock size={16} className="text-accent animate-pulse drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />}
                    <span className="capitalize font-medium text-xs text-foreground">{activity.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center text-[10px]">
                    {activity.user.charAt(0)}
                  </div>
                  {activity.user}
                </td>
                <td className="px-6 py-4 text-muted-foreground group-hover:text-foreground transition-colors">
                  {activity.action}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">
                  {activity.target}
                </td>
                <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
