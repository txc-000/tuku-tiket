<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'total_amount' => fake()->randomElement([500000, 750000, 1500000]),
            'payment_status' => 'pending',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => 'paid',
        ]);
    }
}
