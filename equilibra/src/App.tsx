import { LoadingScreen } from './components/ui/LoadingScreen'
import { MeetingAnalyzer } from './components/MeetingAnalyzer'
import { LoginPage } from './auth/LoginPage'
import { useAuth } from './auth/useAuth';
import './App.css'

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Signing in…" subtext="Preparing your workspace" />;
  }

  if (!user) {
    console.log("Failed to fetch user");
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="user-profile">
          <img src={user.avatar_url} alt={user.name || 'User'} className="user-avatar" />
          <span>{user.name || user.login}</span>
        </div>
      </header>
      <main>
        <MeetingAnalyzer />
      </main>
    </div>
  );
}

export default App
