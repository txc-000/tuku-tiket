import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2, ArrowLeft, Ticket } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * FUNGSI LOGIN UTAMA
   * Menangani autentikasi dan pengalihan berdasarkan Role.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("--- Memulai Proses Login ---");

    try {
      // 1. Authentikasi via Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("Gagal Auth:", authError.message);
        alert(`Gagal Masuk: ${authError.message}`);
        return; // Keluar dari fungsi jika auth gagal
      }

      console.log("Auth Sukses. Mencari data profil untuk ID:", data.user.id);

      // 2. Ambil Role dari tabel profiles
      // Menggunakan .maybeSingle() agar tidak error jika data profil benar-benar tidak ada
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Gagal mengambil profil:", profileError.message);
        navigate('/'); // Default ke Home jika profil bermasalah
      } else if (profile?.role === 'admin') {
        console.log("Role Admin terdeteksi. Mengalihkan ke Dashboard...");
        navigate('/admin');
      } else {
        console.log("Role User terdeteksi. Mengalihkan ke Beranda...");
        navigate('/');
      }

    } catch (err) {
      console.error("Fatal Error:", err);
      alert("Terjadi kesalahan sistem. Periksa koneksi internet atau konfigurasi Supabase Anda.");
    } finally {
      // Menjamin loading berhenti apa pun yang terjadi
      setLoading(false);
      console.log("--- Proses Login Selesai ---");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans text-left">
      {/* Tombol Kembali ke Beranda */}
      <Link to="/" className="absolute top-10 left-10 text-slate-500 hover:text-white flex items-center gap-2 transition-all group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
        <span className="text-xs font-bold uppercase tracking-widest">Beranda</span>
      </Link>

      <div className="w-full max-w-md bg-slate-900/50 p-10 rounded-[40px] border border-white/5 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20 group-hover:rotate-0 transition-transform">
            <Ticket className="-rotate-12 text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic">Login</h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">Masuk untuk mengelola TukuTiket</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* INPUT EMAIL */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                required 
                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                placeholder="admin@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* INPUT PASSWORD */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required 
                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* TOMBOL SUBMIT */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>

          <p className="text-center mt-8 text-slate-500 text-sm font-medium">
            Belum punya akun? <Link to="/register" className="text-blue-500 font-bold hover:underline">Daftar Gratis</Link>
          </p>
        </form>
      </div>
      
      {/* Footer Branding Kecil */}
      <p className="mt-10 text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
        TukuTiket Digital Ecosystem v1.0
      </p>
    </div>
  );
}