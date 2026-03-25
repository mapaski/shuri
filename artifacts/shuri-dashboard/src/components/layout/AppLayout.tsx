import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-grain overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Glow effects in background */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
        
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
