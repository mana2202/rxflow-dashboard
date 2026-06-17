import { ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ListOrdered, LayoutDashboard, ShoppingCart, BarChart2, Settings, Home, Sun, Moon, LogOut, Boxes, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { RoleSwitcher } from './RoleSwitcher';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const navItems: { label: string; path: string; icon: any; roles?: UserRole[] }[] = [
  { label: 'Home',      path: '/home',      icon: Home,          roles: ['operations'] },
  { label: 'Accounts',  path: '/sales',     icon: Users,         roles: ['sales_rep'] },
  { label: 'Queue',     path: '/queue',     icon: ListOrdered,   roles: ['operations'] },
  { label: 'Pipeline',  path: '/pipeline',  icon: LayoutDashboard, roles: ['operations'] },
  { label: 'Incoming',  path: '/incoming',  icon: ShoppingCart,  roles: ['operations'] },
  { label: 'Inventory', path: '/inventory', icon: Boxes,         roles: ['operations', 'procurement'] },
  { label: 'Analytics', path: '/analytics', icon: BarChart2,     roles: ['operations'] },
  { label: 'Settings',  path: '/settings',  icon: Settings },
];

export function AppLayout({ children, title, actions }: { children: ReactNode; title?: string; actions?: ReactNode }) {
  const { pathname } = useLocation();
  const { currentUser, currentRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const visibleNavItems = navItems.filter(i => !i.roles || i.roles.includes(currentRole));
  const isSalesManager = currentRole === 'sales_rep';

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Top bar — sits ABOVE the nav pill (z), with the pill constrained
          to the center gap so logo/actions never collide. */}
      <div className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 pointer-events-none">
        <h1 className="font-display text-xl font-bold tracking-tight pointer-events-auto">
          <span className="text-primary">Rx</span>
          <span className="text-foreground">Flow</span>
        </h1>
        <div className="flex items-center gap-3 pointer-events-auto">
          {actions}
          {/* READ ONLY badge for sales manager */}
          {isSalesManager && (
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-2xs font-semibold uppercase tracking-[0.1em]">
              READ ONLY
            </span>
          )}
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

      {/* Content — generous top offset clears the top bar + pill nav even if
          the pill wraps to a second row on narrow viewports. */}
      <main className="pt-24 max-w-[1280px] mx-auto px-8 pb-12">
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
