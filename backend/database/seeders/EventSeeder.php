<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Seat;
use App\Support\RowLabel;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    /**
     * Seed a handful of realistic events with sections + generated seats, for
     * manual testing of the booking flow, admin dashboard, and seat monitor.
     */
    public function run(): void
    {
        $this->makeEvent(
            title: 'Coldplay: Music of the Spheres',
            date: '2026-11-15',
            venue: 'Stadion Utama GBK, Jakarta',
            price: 500000,
            category: 'music',
            status: 'published',
            image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000',
            themeColor: '#22d3ee',
            sections: [
                ['name' => 'VIP East', 'floor_name' => 'Lower Bowl', 'price' => 1500000, 'row_count' => 4, 'col_count' => 12, 'angle_start' => -45, 'angle_end' => 45, 'radius_inner' => 220, 'radius_outer' => 280, 'color' => '#2563eb'],
                ['name' => 'VIP West', 'floor_name' => 'Lower Bowl', 'price' => 1500000, 'row_count' => 4, 'col_count' => 12, 'angle_start' => 135, 'angle_end' => 225, 'radius_inner' => 220, 'radius_outer' => 280, 'color' => '#4f46e5'],
                ['name' => 'North Stand', 'floor_name' => 'Upper Bowl', 'price' => 750000, 'row_count' => 6, 'col_count' => 18, 'angle_start' => -135, 'angle_end' => -45, 'radius_inner' => 250, 'radius_outer' => 340, 'color' => '#ea580c'],
                ['name' => 'South Stand', 'floor_name' => 'Upper Bowl', 'price' => 750000, 'row_count' => 6, 'col_count' => 18, 'angle_start' => 45, 'angle_end' => 135, 'radius_inner' => 250, 'radius_outer' => 340, 'color' => '#d97706'],
            ],
        );

        $this->makeEvent(
            title: 'Timnas Indonesia vs Thailand',
            date: '2026-09-20',
            venue: 'Stadion Utama GBK, Jakarta',
            price: 150000,
            category: 'sport',
            status: 'published',
            image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1000',
            themeColor: '#ef4444',
            sections: [
                ['name' => 'VIP Barat', 'floor_name' => 'Lower Bowl', 'price' => 500000, 'row_count' => 4, 'col_count' => 10, 'angle_start' => 135, 'angle_end' => 225, 'radius_inner' => 220, 'radius_outer' => 280, 'color' => '#dc2626'],
                ['name' => 'Tribun Utara', 'floor_name' => 'Upper Bowl', 'price' => 150000, 'row_count' => 8, 'col_count' => 20, 'angle_start' => -135, 'angle_end' => -45, 'radius_inner' => 250, 'radius_outer' => 340, 'color' => '#f97316'],
                ['name' => 'Tribun Selatan', 'floor_name' => 'Upper Bowl', 'price' => 150000, 'row_count' => 8, 'col_count' => 20, 'angle_start' => 45, 'angle_end' => 135, 'radius_inner' => 250, 'radius_outer' => 340, 'color' => '#eab308'],
            ],
        );

        $this->makeEvent(
            title: 'Tech Conference Indonesia 2026',
            date: '2026-10-05',
            venue: 'Jakarta Convention Center',
            price: 350000,
            category: 'seminar',
            status: 'published',
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000',
            themeColor: '#8b5cf6',
            sections: [
                ['name' => 'Main Hall', 'floor_name' => 'Ground Floor', 'price' => 350000, 'row_count' => 10, 'col_count' => 14, 'angle_start' => -60, 'angle_end' => 60, 'radius_inner' => 180, 'radius_outer' => 320, 'color' => '#7c3aed'],
                ['name' => 'Balcony', 'floor_name' => '2nd Floor', 'price' => 550000, 'row_count' => 3, 'col_count' => 14, 'angle_start' => -60, 'angle_end' => 60, 'radius_inner' => 130, 'radius_outer' => 165, 'color' => '#a855f7'],
            ],
        );

        $this->makeEvent(
            title: 'Malam Tawa: Stand Up Comedy Special',
            date: '2026-09-05',
            venue: 'Balai Sarbini, Jakarta',
            price: 200000,
            category: 'festival',
            status: 'published',
            image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=1000',
            themeColor: '#f59e0b',
            sections: [
                ['name' => 'Festival Seat', 'floor_name' => 'Ground Floor', 'price' => 200000, 'row_count' => 8, 'col_count' => 16, 'angle_start' => -50, 'angle_end' => 50, 'radius_inner' => 150, 'radius_outer' => 260, 'color' => '#f59e0b'],
            ],
        );

        // Draft — belum tampil di halaman publik, buat tes tampilan admin
        // untuk event yang belum di-publish.
        $this->makeEvent(
            title: 'Jazz Under The Stars (Draft)',
            date: '2027-01-10',
            venue: 'Kebun Raya Bogor',
            price: 400000,
            category: 'music',
            status: 'draft',
            image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?q=80&w=1000',
            themeColor: '#06b6d4',
            sections: [
                ['name' => 'Garden View', 'floor_name' => 'Ground', 'price' => 400000, 'row_count' => 5, 'col_count' => 10, 'angle_start' => -45, 'angle_end' => 45, 'radius_inner' => 200, 'radius_outer' => 260, 'color' => '#0891b2'],
            ],
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $sections
     */
    private function makeEvent(
        string $title,
        string $date,
        string $venue,
        float $price,
        string $category,
        string $status,
        string $image,
        string $themeColor,
        array $sections,
    ): void {
        $event = Event::create([
            'title' => $title,
            'date' => $date,
            'venue' => $venue,
            'price' => $price,
            'category' => $category,
            'status' => $status,
            'image' => $image,
            'theme_color' => $themeColor,
        ]);

        foreach ($sections as $sectionData) {
            $section = $event->sections()->create($sectionData);

            $seats = [];
            for ($row = 0; $row < $section->row_count; $row++) {
                $rowLabel = RowLabel::for($row);
                for ($col = 1; $col <= $section->col_count; $col++) {
                    $seats[] = [
                        'section_id' => $section->id,
                        'row_label' => $rowLabel,
                        'seat_number' => $col,
                        'status' => 'available',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            foreach (array_chunk($seats, 500) as $chunk) {
                Seat::insert($chunk);
            }
        }
    }
}
