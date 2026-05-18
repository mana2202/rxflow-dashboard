import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ListOrdered, LayoutDashboard, ShoppingCart, BarChart2, Settings, Home, Sun, Moon, LogOut, Boxes } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { RoleSwitcher } from './RoleSwitcher';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const navItems: { label: string; path: string; icon: any; roles?: UserRole[] }[] = [
  { label: 'Home', path: '/home', icon: Home },
  { label: 'Queue', path: '/queue', icon: ListOrdered },
  { label: 'Pipeline', path: '/pipeline', icon: LayoutDashboard },
  { label: 'Incoming', path: '/incoming', icon: ShoppingCart },
  { label: 'Inventory', path: '/inventory', icon: Boxes, roles: ['operations'] },
  { label: 'Analytics', path: '/analytics', icon: BarChart2 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AppLayout({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode }) {
  const { pathname } = useLocation();
  const { currentUser, currentRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const visibleNavItems = navItems.filter(i => !i.roles || i.roles.includes(currentRole));

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-8 z-50">
        <h1 className="font-display text-xl font-bold tracking-tight">
          <span className="text-primary">Rx</span>
          <span className="text-foreground">Flow</span>
        </h1>
        <div className="flex items-center gap-3">
          {actions}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <RoleSwitcher />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {currentUser.initials}
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating pill nav */}
      <nav className="nav-pill">
        {visibleNavItems.map(item => {
          const active = item.path === '/home'
            ? pathname === '/home' || pathname === '/'
            : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn('nav-pill-item', active && 'nav-pill-item-active')}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <main className="pt-[88px] max-w-[1280px] mx-auto px-8 pb-12">
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-heading !mb-0">{title}</h2>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
