import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import DashboardMEI from "./pages/DashboardMEI";
import DashboardContador from "./pages/DashboardContador";
import Goals from "./pages/Goals";
import PerformanceCharts from "./pages/PerformanceCharts";
import Reports from "./pages/Reports";
import AcceptInvite from "./pages/AcceptInvite";
import LaborModule from "./pages/LaborModule";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ProRoute from "./components/ProRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardMEI /></ProtectedRoute>} />
          <Route path="/contador" element={<ProtectedRoute><DashboardContador /></ProtectedRoute>} />
          <Route path="/aceitar-convite" element={<AcceptInvite />} />
          <Route path="/metas" element={<ProRoute><Goals /></ProRoute>} />
          <Route path="/graficos" element={<ProRoute><PerformanceCharts /></ProRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/trabalhista" element={<ProRoute><LaborModule /></ProRoute>} />
          <Route path="/precificacao" element={<ProRoute><Pricing /></ProRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
