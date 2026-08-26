<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Seat;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'full_name' => 'Admin TukuTiket',
            'email' => 'admin@tukutiket.test',
            'password' => bcrypt('password'),
        ]);

        $testUser = User::factory()->create([
            'full_name' => 'Test User',
            'email' => 'user@tukutiket.test',
            'password' => bcrypt('password'),
        ]);

        $this->call(EventSeeder::class);

        $this->seedSampleBookingsAndSeatStatuses($testUser);
    }

    /**
     * Marks a handful of seats sold/booked/blocked across the seeded events so
     * the seat map and admin dashboard show realistic variety out of the box,
     * instead of every seat being blankly 'available'. A small, fixed-size
     * booking under the test user's own email is created for each event (so
     * "Tiket Saya" has a few tickets to show, not dozens), separate from a
     * larger batch of guest sales that just populate the seat map visually.
     */
    private function seedSampleBookingsAndSeatStatuses(User $testUser): void
    {
        $guests = [
            ['name' => 'Rina Wijaya', 'email' => 'rina.wijaya@example.com'],
            ['name' => 'Dimas Pratama', 'email' => 'dimas.pratama@example.com'],
            ['name' => 'Sari Handayani', 'email' => 'sari.handayani@example.com'],
        ];

        $events = Event::published()->with('sections.seats')->get();

        foreach ($events as $event) {
            $allSeats = $event->sections->flatMap->seats;
            if ($allSeats->isEmpty()) {
                continue;
            }

            // 2-3 kursi jadi tiket milik test user, biar "Tiket Saya" tidak banjir.
            $myTickets = $allSeats->random(min(3, $allSeats->count()));
            $this->bookSeats($event, $myTickets, $testUser->full_name, $testUser->email, 'paid');

            // ~12% kursi lain terjual ke "pembeli" acak, biar peta kursi ramai.
            $remaining = $allSeats->whereNotIn('id', $myTickets->pluck('id'));
            $guestSoldSeats = collect();
            if ($remaining->isNotEmpty()) {
                $guestSoldSeats = $remaining->random(max(1, (int) ($remaining->count() * 0.12)));
                foreach ($guestSoldSeats->chunk(max(1, (int) ceil($guestSoldSeats->count() / 3))) as $chunk) {
                    $guest = $guests[array_rand($guests)];
                    $this->bookSeats($event, $chunk, $guest['name'], $guest['email'], fake()->boolean(70) ? 'paid' : 'pending');
                }
            }

            // ~5% ditahan (status 'booked', simulasi lagi diproses pengguna lain).
            $remaining = $remaining->whereNotIn('id', $guestSoldSeats->pluck('id'));
            if ($remaining->isNotEmpty()) {
                $heldSeats = $remaining->random(max(1, (int) ($remaining->count() * 0.05)));
                Seat::whereIn('id', $heldSeats->pluck('id'))->update(['status' => 'booked']);
            }
        }
    }

    /**
     * @param  Collection<int, Seat>  $seats
     */
    private function bookSeats(Event $event, $seats, string $name, string $email, string $paymentStatus): void
    {
        $transaction = Transaction::create([
            'event_id' => $event->id,
            'customer_name' => $name,
            'customer_email' => $email,
            'total_amount' => $seats->sum(fn (Seat $seat) => $seat->section->price),
            'payment_status' => $paymentStatus,
        ]);

        Seat::whereIn('id', $seats->pluck('id'))->update([
            'status' => 'sold',
            'transaction_id' => $transaction->id,
            'guest_name' => $name,
            'guest_email' => $email,
        ]);
    }
}
