import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import useAuthStore from '@/store/useAuthStore';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import CategoryPage from '@/pages/CategoryPage';
import SmartRevisionPage from '@/pages/SmartRevisionPage';
import '@/App.css';

function ProtectedRoute({ children }) {
  const token = useAuthStore(state => state.token);
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  const token = useAuthStore(state => state.token);
  
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/dashboard" replace /> : <AuthPage />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/category/:category"
            element={
              <ProtectedRoute>
                <CategoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/smart-revision"
            element={
              <ProtectedRoute>
                <SmartRevisionPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
