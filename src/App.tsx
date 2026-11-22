import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import { useModules } from "@/lib/modules";

// Every page except the landing page loads on demand.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const LostFound = lazy(() => import("./pages/LostFound"));
const Complaints = lazy(() => import("./pages/Complaints"));
const Notices = lazy(() => import("./pages/Notices"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const AnimalWelfare = lazy(() => import("./pages/AnimalWelfare"));
const BloodDonation = lazy(() => import("./pages/BloodDonation"));
const Students = lazy(() => import("./pages/Students"));
const FacultySuggestions = lazy(() => import("./pages/FacultySuggestions"));
const Profile = lazy(() => import("./pages/Profile"));
const CentralAdmin = lazy(() => import("./pages/CentralAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Bicycles = lazy(() => import("./pages/Bicycles"));
const LendBorrow = lazy(() => import("./pages/LendBorrow"));

const queryClient = new QueryClient();

/** A module page, or the 404 page when that module is switched off. */
function Module({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { enabled } = useModules();
  return enabled(pathname) ? <ProtectedRoute>{children}</ProtectedRoute> : <NotFound />;
}

const PageFallback = () => <div className="min-h-screen bg-background" aria-busy="true" />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/central-admin" element={<ProtectedRoute requireAdmin><CentralAdmin /></ProtectedRoute>} />
            <Route path="/lost-found" element={<Module><LostFound /></Module>} />
            <Route path="/complaints" element={<Module><Complaints /></Module>} />
            <Route path="/notices" element={<Module><Notices /></Module>} />
            <Route path="/marketplace" element={<Module><Marketplace /></Module>} />
            <Route path="/animal-welfare" element={<Module><AnimalWelfare /></Module>} />
            <Route path="/blood-donation" element={<Module><BloodDonation /></Module>} />
            <Route path="/bicycles" element={<Module><Bicycles /></Module>} />
            <Route path="/lend-borrow" element={<Module><LendBorrow /></Module>} />
            <Route path="/students" element={<Module><Students /></Module>} />
            <Route path="/faculty-suggestions" element={<Module><FacultySuggestions /></Module>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
