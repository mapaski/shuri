import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center glass-panel p-10 rounded-3xl border border-white/5"
      >
        <div className="text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/20 mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold mb-4">Sector Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The requested system module does not exist or has been relocated.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
        >
          Return to Hub
        </Link>
      </motion.div>
    </div>
  );
}
