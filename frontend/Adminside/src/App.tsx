
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Events from "./pages/Events";
import Gallery from "./pages/Gallery";
import Setting from "./pages/Setting";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import VerifyOtp from "./pages/verifyOtp";
import {initializeAPI} from "./api/api";
import useAuth from './hooks/useAuth';
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeAPI().catch((error) => {
      console.error('Failed to initialize API:', error);
    });
  }, []);
  return(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Index />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            {/* <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } /> */}
            <Route path="/members" element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            } />
            <Route path="/gallery" element={
              <ProtectedRoute>
                <Gallery />
              </ProtectedRoute>
            } />
            <Route path="/setting" element={
              <ProtectedRoute>
                <Setting />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);};

export default App;
