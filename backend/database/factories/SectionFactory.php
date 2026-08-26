<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Section>
 */
class SectionFactory extends Factory
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
            'name' => fake()->randomElement(['VIP East', 'VIP West', 'North Stand', 'South Stand']),
            'floor_name' => 'Ground Floor',
            'price' => fake()->randomElement([500000, 750000, 1500000]),
            'row_count' => 5,
            'col_count' => 10,
            'layout_type' => 'bowl',
            'angle_start' => -45,
            'angle_end' => 45,
            'radius_inner' => 220,
            'radius_outer' => 280,
            'map_angle' => 0,
            'color' => fake()->randomElement(['#2563eb', '#4f46e5', '#ea580c', '#d97706']),
        ];
    }
}
