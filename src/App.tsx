import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import LostFound from "./pages/LostFound";
import Complaints from "./pages/Complaints";
import Notices from "./pages/Notices";
import Marketplace from "./pages/Marketplace";
import AnimalWelfare from "./pages/AnimalWelfare";
import BloodDonation from "./pages/BloodDonation";
import Students from "./pages/Students";
import FacultySuggestions from "./pages/FacultySuggestions";
import Profile from "./pages/Profile";
import DatabaseTest from "./pages/DatabaseTest";
import NotFound from "./pages/NotFound";
import AIAssistant from "@/components/AIAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/lost-found" element={<ProtectedRoute><LostFound /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
            <Route path="/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/animal-welfare" element={<ProtectedRoute><AnimalWelfare /></ProtectedRoute>} />
            <Route path="/blood-donation" element={<ProtectedRoute><BloodDonation /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/faculty-suggestions" element={<ProtectedRoute><FacultySuggestions /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/test-db" element={<ProtectedRoute><DatabaseTest /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistant />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
