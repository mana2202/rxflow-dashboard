import { useLocation, Link } from 'react-router-dom';
import { ListOrdered, LayoutDashboard, ShoppingCart, BarChart2, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Priority Queue', path: '/queue', icon: ListOrdered },
  { label: 'Pipeline Board', path: '/pipeline', icon: LayoutDashboard },
  { label: 'Incoming Orders', path: '/incoming', icon: ShoppingCart },
  { label: 'Analytics', path: '/analytics', icon: BarChart2 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { currentUser, logout } = useAuth();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <h1 className="font-display text-xl font-bold tracking-tight">
          <span className="text-primary">Rx</span>
          <span className="text-foreground">Flow</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Northeast Distribution — Boston, MA</p>
      </div>

      <nav className="flex-1 py-3">
        {navItems.map(item => {
          const active = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-5 py-2.5 text-sm transition-colors',
                active
                  ? 'nav-item-active text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            {currentUser.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.role.replace('_', ' ')}</p>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
