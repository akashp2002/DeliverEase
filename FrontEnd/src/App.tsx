import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DeliveryProvider } from "@/contexts/DeliveryContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AgentManagement from "./pages/admin/AgentManagement";
import ScheduledDeliveries from "./pages/admin/ScheduledDeliveries";
import AssignDeliveries from "./pages/admin/AssignDeliveries";
import ReportsAnalysis from "./pages/admin/ReportsAnalysis";

// Agent Pages
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentRouteOptimization from "./pages/agent/RouteOptimization";
import MapVisualization from "./pages/agent/MapVisualization";
import AssignedRoute from "./pages/agent/AssignedRoute";
import DeliveryStatus from "./pages/agent/DeliveryStatus";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DeliveryProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LoginPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/agents" element={
                <ProtectedRoute allowedRoles={['admin']}><AgentManagement /></ProtectedRoute>
              } />
              <Route path="/admin/deliveries" element={
                <ProtectedRoute allowedRoles={['admin']}><ScheduledDeliveries /></ProtectedRoute>
              } />
              <Route path="/admin/assign" element={
                <ProtectedRoute allowedRoles={['admin']}><AssignDeliveries /></ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute allowedRoles={['admin']}><ReportsAnalysis /></ProtectedRoute>
              } />

              {/* Agent Routes */}
              <Route path="/agent" element={
                <ProtectedRoute allowedRoles={['agent']}><AgentDashboard /></ProtectedRoute>
              } />
              <Route path="/agent/optimize" element={
                <ProtectedRoute allowedRoles={['agent']}><AgentRouteOptimization /></ProtectedRoute>
              } />
              <Route path="/agent/map" element={
                <ProtectedRoute allowedRoles={['agent']}><MapVisualization /></ProtectedRoute>
              } />
              <Route path="/agent/route" element={
                <ProtectedRoute allowedRoles={['agent']}><AssignedRoute /></ProtectedRoute>
              } />
              <Route path="/agent/status" element={
                <ProtectedRoute allowedRoles={['agent']}><DeliveryStatus /></ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DeliveryProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
