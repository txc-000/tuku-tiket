<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'date' => fake()->dateTimeBetween('now', '+6 months'),
            'venue' => fake()->city().' Stadium',
            'price' => fake()->randomElement([250000, 500000, 750000, 1500000]),
            'category' => fake()->randomElement(['music', 'sport', 'festival']),
            'image' => fake()->imageUrl(),
            'status' => 'draft',
            'theme_color' => fake()->hexColor(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
        ]);
    }
}
