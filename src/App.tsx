import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login from "./pages/Login";
import PriorityQueue from "./pages/PriorityQueue";
import PipelineBoard from "./pages/PipelineBoard";
import OrderDetail from "./pages/OrderDetail";
import Analytics from "./pages/Analytics";
import IncomingOrders from "./pages/IncomingOrders";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { roleDefaultPaths } from "./data/demo";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLoggedIn, currentRole } = useAuth();

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={roleDefaultPaths[currentRole]} replace />} />
      <Route path="/queue" element={<PriorityQueue />} />
      <Route path="/pipeline" element={<PipelineBoard />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/incoming" element={<IncomingOrders />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
