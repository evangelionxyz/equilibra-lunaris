import { LoadingScreen } from './components/ui/LoadingScreen'
import { LoginPage } from './auth/LoginPage'
import { useAuth } from './auth/authContext';
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
    <div>Hello {user.name}</div>
  );
}

export default App
