import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { roleDefaultPaths } from '@/data/demo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, currentRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    navigate(roleDefaultPaths[currentRole]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
      <div className="w-full max-w-sm card-pharma p-8" style={{ borderRadius: '8px' }}>
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            <span className="text-primary">Rx</span>
            <span className="text-foreground">Flow</span>
          </h1>
          <p className="text-sm text-muted-foreground">Precision order management for pharmaceutical retail.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@rxflow.com"
              className="w-full px-3 py-2 text-sm border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button type="submit" className="btn-pharma w-full py-2.5">
            Sign In
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Demo: any credentials work.
        </p>
      </div>
    </div>
  );
}
