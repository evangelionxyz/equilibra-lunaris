import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "./auth/authContext";
import { useAuth } from "./auth/useAuth";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { LoginPage } from "./auth/LoginPage";
import { Sidebar } from "./components/layout/Sidebar";
import { DashboardPage } from "./pages/Dashboard";
import { WorkspacesPage } from "./pages/Workspaces";
import { ProjectDetailsPage } from "./pages/ProjectDetails";
import { NotificationsPage } from "./pages/Notifications";
import { SettingsModal } from "./components/modals/SettingsModal";
import { TelegramLinkPrompt } from "./components/notifications/TelegramLinkPrompt";
import { useState } from "react";
import "./App.css";

function AppShell() {
  const { user, isLoading } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (isLoading) return <LoadingScreen message="Resolving session…" />;
  if (!user) return <LoginPage />;

  return (
    <div className="h-screen w-full bg-[#0B0E14] text-slate-300 font-sans flex overflow-hidden selection:bg-[#3B82F6]/30">
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailsPageWrapper />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <TelegramLinkPrompt onOpenSettings={() => setIsSettingsOpen(true)} />
    </div>
  );
}

// Wrapper to pass the projectId param correctly to the old component prop structure
import { useParams } from "react-router-dom";
function ProjectDetailsPageWrapper() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  if (!projectId) {
    navigate('/workspaces', { replace: true });
    return null;
  }

  return <ProjectDetailsPage projectId={projectId} />;
}

import { ToastProvider } from './design-system/Toast';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

