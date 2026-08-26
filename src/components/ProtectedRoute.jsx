import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '../lib/auth';
import { isDemoMode } from '../lib/demoMode';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldOff } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  // Admin surfaces are hidden entirely in the public demo — almost every
  // control on them is a mutation, so a redirect beats a dashboard full of
  // gated buttons.
  if (isDemoMode()) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center text-white">
        <ShieldOff className="text-slate-600" size={40} />
        <p className="text-slate-400 font-bold max-w-sm">
          Fitur admin dinonaktifkan di demo publik ini. Clone dan jalankan di lokal untuk akses penuh.
        </p>
      </div>
    );
  }

  if (loading) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}