
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClerkProvider from "./components/ClerkProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import UserSync from "./components/UserSync";
import NotificationProvider from "./components/notifications/NotificationProvider";
import AudioEnabler from "./components/notifications/AudioEnabler";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import HouseOwner from "./pages/HouseOwner";
import Admin from "./pages/Admin";
import PaymentCallback from "./pages/PaymentCallback";
import NotFound from "./pages/NotFound";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import RoleSelectionAuth from "./components/RoleSelectionAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Limit retries to prevent resource exhaustion
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
    },
    mutations: {
      retry: 2, // Limit mutation retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

const App = () => (
  <ClerkProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UserSync />
        <AudioEnabler />
        <NotificationProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<RoleSelectionAuth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/owner" element={
              <ProtectedRoute>
                <HouseOwner />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/payment/callback" element={
              <ProtectedRoute>
                <PaymentCallback />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
