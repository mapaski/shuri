import { motion } from "framer-motion";
import { Construction } from "lucide-react";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="max-w-7xl mx-auto h-[80vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-12 text-center rounded-3xl max-w-lg border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <div className="w-20 h-20 bg-white/5 text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
          <Construction size={32} />
        </div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-3">{title}</h1>
        <p className="text-muted-foreground leading-relaxed">
          This module is currently undergoing system upgrades. Advanced analytics and features will be available in the next deployment cycle.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="mt-8 px-6 py-2.5 rounded-full bg-white/5 text-foreground hover:bg-white/10 border border-white/10 transition-all font-medium text-sm"
        >
          Return to Overview
        </button>
      </motion.div>
    </div>
  );
}
