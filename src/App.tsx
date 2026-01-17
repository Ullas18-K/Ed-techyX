import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/lib/authStore";
import { LoginScreen } from "@/components/auth/LoginScreen";
import HomePage from "./pages/HomePage";
import LearningPlanPage from "./pages/LearningPlanPage";
import OpticsPage from "./pages/OpticsPage";
import SimulationPage from "./pages/SimulationPage";
import QuizPage from "./pages/QuizPage";
import ReflectionPage from "./pages/ReflectionPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import MasteryPage from "./pages/MasteryPage";
import NotFound from "./pages/NotFound";
import OpticsPuzzle from "./pages/gamified/OpticsPuzzle";
import { toast } from "sonner";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => toast.success('Welcome to AI Learning Forge!')} />;
  }

  return <>{children}</>;
};

import { StudyRoomManager } from "@/components/studyroom/StudyRoomManager";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <StudyRoomManager />
        <Routes>
          <Route path="/optics-puzzle" element={<ProtectedRoute><OpticsPuzzle /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute><LearningPlanPage /></ProtectedRoute>} />
          <Route path="/optics" element={<ProtectedRoute><OpticsPage /></ProtectedRoute>} />
          <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/reflection" element={<ProtectedRoute><ReflectionPage /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
          <Route path="/mastery" element={<ProtectedRoute><MasteryPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
