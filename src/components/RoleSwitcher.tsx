import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { roleLabels, roleDefaultPaths } from '@/data/demo';
import type { UserRole } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const roles: UserRole[] = ['sales_rep', 'operations', 'procurement'];

export function RoleSwitcher() {
  const { currentRole, setRole } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors"
      >
        <span className="text-muted-foreground">Viewing as:</span>
        <span className="font-semibold">{roleLabels[currentRole]}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-xl shadow-elevated z-50 py-1 overflow-hidden">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setOpen(false); navigate(roleDefaultPaths[r]); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors ${r === currentRole ? 'font-semibold text-primary' : 'text-foreground'}`}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
