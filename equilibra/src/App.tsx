import { useState } from "react";
import { AuthProvider } from "./auth/authContext";
import { useAuth } from "./auth/useAuth";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { LoginPage } from "./auth/LoginPage";
import { Sidebar } from "./components/layout/Sidebar";
import { DashboardPage } from "./pages/Dashboard";
import { WorkspacesPage } from "./pages/Workspaces";
import { ProjectDetailsPage } from "./pages/ProjectDetails";
import { NotificationsPage } from "./pages/Notifications";
import "./App.css";

function AppShell() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  if (isLoading) return <LoadingScreen message="Resolving session…" />;
  if (!user) return <LoginPage />;

  return (
    <div className="h-screen w-full bg-[#0B0E14] text-slate-300 font-sans flex overflow-hidden selection:bg-[#3B82F6]/30">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
        {currentPage === "dashboard" && (
          <DashboardPage
            setPage={setCurrentPage}
            setProject={setSelectedProjectId}
          />
        )}
        {currentPage === "workspaces" && (
          <WorkspacesPage
            setPage={setCurrentPage}
            setProject={setSelectedProjectId}
          />
        )}
        {currentPage === "project" && (
          <ProjectDetailsPage projectId={selectedProjectId!} />
        )}
        {currentPage === "notifications" && <NotificationsPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
