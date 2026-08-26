<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Seat;
use App\Models\Section;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_guest_can_book_available_seats_with_their_own_email(): void
    {
        $event = Event::factory()->published()->create();
        $section = Section::factory()->for($event)->create(['price' => 500000]);
        $seats = Seat::factory()->for($section)->count(2)->create(['status' => 'available']);

        $response = $this->postJson('/api/transactions', [
            'event_id' => $event->id,
            'seat_ids' => $seats->pluck('id')->all(),
            'customer_name' => 'Budi Guest',
            'customer_email' => 'budi@example.com',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.customer_email', 'budi@example.com')
            ->assertJsonPath('data.payment_status', 'pending')
            // total is recomputed server-side from the section price, not trusted from
            // the client. PHP's json_encode drops the ".0" for whole-number floats, so
            // the wire value decodes back to an int here.
            ->assertJsonPath('data.total_amount', 1000000);

        foreach ($seats as $seat) {
            $this->assertDatabaseHas('seats', [
                'id' => $seat->id,
                'status' => 'sold',
                'guest_email' => 'budi@example.com',
            ]);
        }
    }

    public function test_booking_fails_without_a_guest_email(): void
    {
        $event = Event::factory()->published()->create();
        $section = Section::factory()->for($event)->create();
        $seat = Seat::factory()->for($section)->create(['status' => 'available']);

        $this->postJson('/api/transactions', [
            'event_id' => $event->id,
            'seat_ids' => [$seat->id],
        ])->assertStatus(422)->assertJsonValidationErrors(['customer_email']);
    }

    public function test_a_logged_in_user_does_not_need_to_supply_their_email(): void
    {
        $user = User::factory()->create(['email' => 'user@example.com']);
        $event = Event::factory()->published()->create();
        $section = Section::factory()->for($event)->create();
        $seat = Seat::factory()->for($section)->create(['status' => 'available']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/transactions', [
                'event_id' => $event->id,
                'seat_ids' => [$seat->id],
            ])
            ->assertCreated()
            ->assertJsonPath('data.customer_email', 'user@example.com');
    }

    public function test_booking_an_already_sold_seat_is_rejected(): void
    {
        $event = Event::factory()->published()->create();
        $section = Section::factory()->for($event)->create();
        $seat = Seat::factory()->for($section)->create(['status' => 'sold']);

        $response = $this->postJson('/api/transactions', [
            'event_id' => $event->id,
            'seat_ids' => [$seat->id],
            'customer_name' => 'Late Comer',
            'customer_email' => 'late@example.com',
        ]);

        $response->assertStatus(409);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_booking_one_taken_seat_in_a_multi_seat_cart_rejects_the_whole_booking(): void
    {
        // Guards against a partial-booking bug: if seat A is available but seat B
        // was just taken by someone else, the whole request must fail atomically
        // rather than silently selling only seat A.
        $event = Event::factory()->published()->create();
        $section = Section::factory()->for($event)->create();
        $available = Seat::factory()->for($section)->create(['status' => 'available']);
        $alreadySold = Seat::factory()->for($section)->create(['status' => 'sold']);

        $this->postJson('/api/transactions', [
            'event_id' => $event->id,
            'seat_ids' => [$available->id, $alreadySold->id],
            'customer_name' => 'Cart Buyer',
            'customer_email' => 'cart@example.com',
        ])->assertStatus(409);

        $this->assertDatabaseHas('seats', ['id' => $available->id, 'status' => 'available']);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_simulate_payment_flips_status_to_paid(): void
    {
        $transaction = Transaction::factory()->create(['payment_status' => 'pending']);

        $this->postJson("/api/transactions/{$transaction->id}/simulate-payment")
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'paid');

        $this->assertDatabaseHas('transactions', ['id' => $transaction->id, 'payment_status' => 'paid']);
    }
}
