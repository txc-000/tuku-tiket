import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Ticket, LayoutDashboard, LogOut, User, 
  ChevronDown, Settings, Bell 
} from 'lucide-react';

export default function Navbar() {
  const [profile, setProfile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async (userId) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(data);
    };

    // Ambil sesi awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id);
    });

    // Dengarkan perubahan status auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 fixed top-0 left-0 right-0 z-[100] h-20 flex items-center px-8">
      <div className="max-w-[1600px] mx-auto w-full flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-blue-600 p-2 rounded-xl rotate-12 group-hover:rotate-0 transition-all shadow-lg shadow-blue-600/20">
            <Ticket className="text-white -rotate-12 group-hover:rotate-0 transition-transform" size={22} />
          </div>
          <span className="text-2xl font-black text-white italic tracking-tighter uppercase">
            Tuku<span className="text-blue-500">Tiket</span>
          </span>
        </Link>

        {/* NAVIGATION RIGHT */}
        <div className="flex items-center gap-6">
          {profile ? (
            <div className="relative">
              {/* TOMBOL USER DROPDOWN */}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-full transition-all border ${
                  isDropdownOpen ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg font-black text-xs">
                  {profile.full_name?.charAt(0) || <User size={16}/>}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">
                    {profile.full_name || 'User'}
                  </p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
                    {profile.role || 'Member'}
                  </p>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* ISI DROPDOWN */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[-1]" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-4 w-64 bg-slate-900 border border-white/10 rounded-[30px] shadow-2xl overflow-hidden animate-fade-in-up">
                    
                    <div className="p-3 border-b border-white/5 space-y-1">
                      {/* Link Admin Panel (Hanya muncul jika Role = Admin) */}
                      {profile.role === 'admin' && (
                        <button 
                          onClick={() => { navigate('/admin'); setIsDropdownOpen(false); }}
                          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-blue-400 hover:bg-blue-500/10 transition-all group"
                        >
                          <LayoutDashboard size={18} />
                          <span className="text-xs font-black uppercase tracking-widest">Admin Panel</span>
                        </button>
                      )}

                      {/* Link Tiket Saya (Muncul untuk semua user) */}
                      <button 
                        onClick={() => { navigate('/my-tickets'); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <Ticket size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Tiket Saya</span>
                      </button>

                      <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <Settings size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Pengaturan</span>
                      </button>
                    </div>

                    <div className="p-3 bg-red-500/5">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Keluar</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link 
              to="/login" 
              className="text-white text-[10px] font-black uppercase tracking-[0.2em] bg-blue-600 px-8 py-3.5 rounded-full hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}