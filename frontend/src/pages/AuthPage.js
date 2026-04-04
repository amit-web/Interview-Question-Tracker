import { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  
  const setAuth = useAuthStore(state => state.setAuth);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;
      
      const response = await api.post(endpoint, payload);
      setAuth(response.data.user, response.data.token);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black font-chivo tracking-tighter mb-2">
              Interview Prep Tracker
            </h1>
            <p className="text-gray-500 text-sm font-ibm-plex-sans">
              Track, revise, and master your frontend interviews
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1.5 font-ibm-plex-sans">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    data-testid="auth-name-input"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 rounded-sm font-ibm-plex-sans"
                    required
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1.5 font-ibm-plex-sans">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  data-testid="auth-email-input"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 rounded-sm font-ibm-plex-sans"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 font-ibm-plex-sans">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  data-testid="auth-password-input"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 rounded-sm font-ibm-plex-sans"
                  required
                />
              </div>
            </div>
            
            <Button
              data-testid="auth-submit-button"
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 rounded-sm font-medium font-ibm-plex-sans"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              data-testid="auth-toggle-button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-600 hover:text-black font-ibm-plex-sans transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
