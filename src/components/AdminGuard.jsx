import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminGuard({ children }) {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setIsAdmin(false);

      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setIsAdmin(data?.role === 'admin');
    }
    checkRole();
  }, []);

  if (isAdmin === null) return null; // Loading state
  return isAdmin ? children : <Navigate to="/" />;
}