// src/data/mockData.js

export const EVENTS = [
  {
    id: 1,
    title: "Coldplay: Music of the Spheres",
    date: "15 November 2026",
    venue: "Stadion Utama GBK",
    price: 1500000,
    image: "https://placehold.co/600x400/1e293b/FFF?text=Coldplay+Jakarta",
  }
];

// Kita generate 40 kursi (5 baris x 8 kolom)
// Status kita acak biar ada yang merah (Sold) dan putih (Available)
export const SEATS_LAYOUT = Array.from({ length: 40 }, (_, i) => {
  const rowLabels = ['A', 'B', 'C', 'D', 'E'];
  const rowIndex = Math.floor(i / 8);
  const colIndex = (i % 8) + 1;
  
  return {
    id: `${rowLabels[rowIndex]}${colIndex}`,
    row: rowLabels[rowIndex],
    number: colIndex,
    status: Math.random() > 0.7 ? 'sold' : 'available', // 30% kemungkinan terjual
    price: 1500000
  };
});
