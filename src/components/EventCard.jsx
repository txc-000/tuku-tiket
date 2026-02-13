import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EventCard({ event }) {
  return (
    <div className="group bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
      {/* Gambar Poster */}
      <div className="h-56 overflow-hidden relative">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Badge Kategori */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full text-white uppercase border border-white/10">
          {event.category}
        </div>
      </div>

      {/* Detail Acara */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
          {event.title}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-400 mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-red-500" />
            <span>{event.venue}</span>
          </div>
        </div>

        {/* Harga & Tombol */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div>
            <p className="text-xs text-gray-500">Mulai dari</p>
            <p className="text-lg font-bold text-white">
              Rp {event.price.toLocaleString('id-ID')}
            </p>
          </div>
          <Link 
            to={`/book/${event.id}`}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            Beli Tiket
          </Link>
        </div>
      </div>
    </div>
  );
}