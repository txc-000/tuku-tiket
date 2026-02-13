import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Halaman Utama
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BookingPage from './pages/BookingPage';
import MyTickets from './pages/MyTickets';

// Import Admin & Proteksi
import AdminDashboard from './pages/admin/AdminDashboard';
import TicketScanner from './pages/admin/TicketScanner'; // Pastikan path ini benar
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTE PUBLIK --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-tickets" element={<MyTickets />} />
        <Route path="/book/:eventId" element={<BookingPage />} />

        {/* --- RUTE PROTEKSI (Admin Only) --- */}
        {/* Dashboard Utama */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Scanner Gate (Hanya bisa diakses Admin/Staff) */}
        <Route 
          path="/admin/scanner" 
          element={
            <ProtectedRoute>
              <TicketScanner />
            </ProtectedRoute>
          } 
        />

        {/* --- 404 Not Found --- */}
        <Route 
          path="*" 
          element={
            <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
              <h1 className="text-9xl font-black italic opacity-10 select-none">404</h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest -mt-10">Halaman Tidak Ditemukan</p>
              <a href="/" className="mt-8 px-6 py-3 border border-zinc-700 rounded-full text-zinc-300 text-xs font-bold uppercase hover:bg-white hover:text-black transition-all">
                Kembali ke Beranda
              </a>
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}