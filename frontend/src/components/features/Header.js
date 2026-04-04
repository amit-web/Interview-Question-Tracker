import { useNavigate } from 'react-router-dom';
import { LogOut, User, Zap, LayoutDashboard } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200 backdrop-saturate-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div 
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer"
          >
            <h1 className="text-xl font-black font-chivo tracking-tighter">Interview Prep</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              data-testid="smart-revision-nav-btn"
              onClick={() => navigate('/smart-revision')}
              className="bg-amber-500 text-white hover:bg-amber-600 rounded-sm font-medium font-ibm-plex-sans"
            >
              <Zap className="w-4 h-4 mr-2" />
              Smart Revision
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid="user-menu-trigger"
                  variant="outline"
                  className="rounded-sm font-ibm-plex-sans"
                >
                  <User className="w-4 h-4 mr-2" />
                  {user?.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium font-ibm-plex-sans">{user?.name}</p>
                  <p className="text-xs text-gray-500 font-ibm-plex-sans">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="logout-btn" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
