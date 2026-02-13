import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: formData.fullName } }
    });

    if (error) alert("Gagal Daftar: " + error.message);
    else {
      alert("Berhasil! Silakan Login.");
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-left">
      <Link to="/login" className="absolute top-10 left-10 text-slate-500 hover:text-white flex items-center gap-2 transition-all">
        <ArrowLeft size={18} /> Ke Login
      </Link>
      <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-[40px] border border-white/5 shadow-2xl">
        <h1 className="text-3xl font-black mb-10 tracking-tighter italic text-center">Buat Akun</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" required className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 outline-none focus:ring-2 focus:ring-blue-600" placeholder="Nama Anda" onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="email" required className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 outline-none focus:ring-2 focus:ring-blue-600" placeholder="email@anda.com" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="password" required className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 outline-none focus:ring-2 focus:ring-blue-600" placeholder="••••••••" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Daftar"}
          </button>
        </form>
      </div>
    </div>
  );
}