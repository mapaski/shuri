import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import NetworkMap from "@/pages/NetworkMap";
import DeviceList from "@/pages/DeviceList";
import Alerts from "@/pages/Alerts";
import Heatmap from "@/pages/Heatmap";
import Compliance from "@/pages/Compliance";
import NotFound from "@/pages/not-found";
import { DeviceDrawerProvider } from "@/context/device-drawer-context";
import DeviceDrawer from "@/components/DeviceDrawer";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={NetworkMap} />
        <Route path="/network-map" component={NetworkMap} />
        <Route path="/device-list" component={DeviceList} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/heatmap" component={Heatmap} />
        <Route path="/compliance" component={Compliance} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DeviceDrawerProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <DeviceDrawer />
        </DeviceDrawerProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
