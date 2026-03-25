import { useQuery } from "@tanstack/react-query";

// Types
export interface KPIData {
  title: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
  metric: string;
}

export interface ChartDataPoint {
  name: string;
  revenue: number;
  users: number;
  active: number;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  status: "success" | "pending" | "failed";
  avatar?: string;
}

// Mock Data Generators
const generateMockCharts = (): ChartDataPoint[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map(month => ({
    name: month,
    revenue: Math.floor(Math.random() * 50000) + 20000,
    users: Math.floor(Math.random() * 5000) + 1000,
    active: Math.floor(Math.random() * 3000) + 500,
  }));
};

const mockKPIs: KPIData[] = [
  { title: "Total Revenue", value: "$284,392", change: 12.5, trend: "up", metric: "vs last month" },
  { title: "Active Users", value: "24,892", change: 5.2, trend: "up", metric: "vs last month" },
  { title: "Bounce Rate", value: "2.4%", change: -1.1, trend: "up", metric: "vs last month" },
  { title: "System Health", value: "99.9%", change: 0, trend: "neutral", metric: "uptime SLA" },
];

const mockActivities: Activity[] = [
  { id: "1", user: "Alice Chen", action: "deployed", target: "Production Environment", time: "2 mins ago", status: "success" },
  { id: "2", user: "System", action: "triggered", target: "Database Backup", time: "15 mins ago", status: "success" },
  { id: "3", user: "Bob Smith", action: "failed login", target: "Admin Console", time: "1 hr ago", status: "failed" },
  { id: "4", user: "Sarah Jenkins", action: "updated", target: "Billing Settings", time: "2 hrs ago", status: "success" },
  { id: "5", user: "API Gateway", action: "scaling", target: "Cluster Alpha", time: "3 hrs ago", status: "pending" },
];

// Hooks
export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      // Simulate network delay for realistic loading states
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        kpis: mockKPIs,
        chartData: generateMockCharts(),
        activities: mockActivities,
      };
    }
  });
}
