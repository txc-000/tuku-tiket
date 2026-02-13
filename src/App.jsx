import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import Halaman Utama
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BookingPage from './pages/BookingPage';
import MyTickets from './pages/MyTickets';

// Import Admin & Proteksi
import AdminDashboard from './pages/admin/AdminDashboard';
import TicketScanner from './pages/admin/TicketScanner'; // Tambahkan ini
import ProtectedRoute from './components/ProtectedRoute';

/**
 * STRUKTUR ROUTING UTAMA
 * Mengatur akses publik dan akses khusus Admin.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTE PUBLIK --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rute My Tickets diletakkan di publik (atau buat Protected khusus User) */}
        <Route path="/my-tickets" element={<MyTickets />} />

        {/* Gunakan /book/:eventId agar sesuai dengan link di Home */}
        <Route path="/book/:eventId" element={<BookingPage />} />


        {/* --- RUTE PROTEKSI (Admin Only) --- */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* DAFTARKAN SCANNER DI SINI AGAR TERPROTEKSI JUGA */}
        <Route 
          path="/admin/scanner" 
          element={
            <ProtectedRoute>
              <TicketScanner />
            </ProtectedRoute>
          } 
        />

        {/* --- RUTE FALLBACK --- */}
        <Route 
          path="*" 
          element={
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
              <h1 className="text-9xl font-black italic opacity-10">404</h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest -mt-10">Halaman Tidak Ditemukan</p>
              <a href="/" className="mt-8 text-blue-500 font-bold hover:underline">Kembali ke Beranda</a>
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}