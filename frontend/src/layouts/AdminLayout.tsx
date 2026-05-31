import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { authApi } from '@/api';
import { useAuthStore } from '@/stores/auth';

export function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logoutUser = useAuthStore((s) => s.logoutUser);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
    }
    logoutUser();
    navigate('/login');
  };

  const navLinkClass =
    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors';

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-semibold">ResumeHelper</span>
            <span className="text-xs text-muted-foreground">— Панель администратора</span>
          </Link>
          <nav className="flex items-center gap-1">
            {user && (
              <span
                className="text-xs text-muted-foreground border-r pr-3 mr-2 hidden md:inline"
                title={user.email}
              >
                {user.full_name || user.email}
              </span>
            )}
            <button onClick={handleLogout} className={navLinkClass}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
