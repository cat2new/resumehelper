import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, FolderOpen, LayoutDashboard, User, AlertCircle } from 'lucide-react';
import { authApi, profileApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import type { Profile } from '@/types/api';

export function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logoutUser = useAuthStore((s) => s.logoutUser);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    profileApi.get().then(setProfile).catch(() => {});
  }, [location.pathname]);

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

  const showBanner = profile && !profile.is_complete && location.pathname !== '/profile';

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              R
            </div>
            <span className="font-semibold">ResumeHelper</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">— НИУ ВШЭ</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/" className={navLinkClass}>
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Дашборд</span>
            </Link>
            <Link to="/profile" className={navLinkClass}>
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Мой профиль</span>
              {profile && !profile.is_complete && (
                <span className="h-2 w-2 rounded-full bg-amber-500" title="Профиль не заполнен" />
              )}
            </Link>
            <Link to="/portfolio" className={navLinkClass}>
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Портфолио</span>
            </Link>
            {user && (
              <span
                className="text-xs text-muted-foreground border-l pl-3 ml-2 hidden md:inline"
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

      {showBanner && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2 text-sm text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                Заполните профиль (ФИО, телефон, email и фото), чтобы создавать резюме.
              </span>
            </div>
            <Link
              to="/profile"
              className="text-amber-900 underline font-medium whitespace-nowrap hover:text-amber-700"
            >
              К профилю →
            </Link>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
