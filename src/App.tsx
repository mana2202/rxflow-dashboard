import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { roleDefaultPaths } from "@/data/demo";
import Login from "./pages/Login";
import Home from "./pages/Home";
import PriorityQueue from "./pages/PriorityQueue";
import PipelineBoard from "./pages/PipelineBoard";
import OrderDetail from "./pages/OrderDetail";
import Analytics from "./pages/Analytics";
import IncomingOrders from "./pages/IncomingOrders";
import SettingsPage from "./pages/Settings";
import InventoryDetails from "./pages/InventoryDetails";
import SalesManagerHome from "./pages/SalesManagerHome";
import OverrideLog from "./pages/OverrideLog";
import NotFound from "./pages/NotFound";

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
      <Route path="/home" element={<Home />} />
      <Route path="/sales" element={<SalesManagerHome />} />
      <Route path="/queue" element={<PriorityQueue />} />
      <Route path="/pipeline" element={<PipelineBoard />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/incoming" element={<IncomingOrders />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/override-log" element={<OverrideLog />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/inventory" element={<InventoryDetails />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
