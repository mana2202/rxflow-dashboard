import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { RoleSwitcher } from './RoleSwitcher';

export function AppLayout({ children, title, actions }: { children: ReactNode; title: string; actions?: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <div className="flex items-center gap-3">
            {actions}
            <RoleSwitcher />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
