<?php

namespace Database\Factories;

use App\Models\Seat;
use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Seat>
 */
class SeatFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'section_id' => Section::factory(),
            'row_label' => fake()->randomLetter(),
            'seat_number' => fake()->numberBetween(1, 20),
            'status' => 'available',
        ];
    }

    public function sold(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sold',
        ]);
    }
}
