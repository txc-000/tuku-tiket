import { twMerge } from 'tailwind-merge';

export default function Seat({ data, isSelected, onSelect }) {
  const baseStyle = "w-10 h-10 m-1 rounded-t-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200 border-b-4";
  
  const statusStyles = {
    available: "bg-gray-200 border-gray-300 hover:bg-green-400 hover:border-green-500 text-gray-600",
    selected: "bg-blue-600 border-blue-800 text-white transform -translate-y-1 shadow-lg",
    sold: "bg-red-900 border-red-950 text-red-200 cursor-not-allowed opacity-60",
    booked: "bg-yellow-400 border-yellow-600 text-yellow-900 cursor-not-allowed", // Tambahan status booked
  };

  // Prioritas Status: Sold > Booked > Selected > Available
  let status = 'available';
  if (data.status === 'sold') status = 'sold';
  else if (data.status === 'booked') status = 'booked'; // Support status booked
  else if (isSelected) status = 'selected';

  return (
    <div 
      onClick={() => status === 'available' && onSelect(data)}
      className={twMerge(baseStyle, statusStyles[status])}
    >
      {/* Baca kolom dari Database: row_label & seat_number */}
      {data.row_label || data.row}{data.seat_number || data.number}
    </div>
  );
}