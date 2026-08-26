<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use App\Support\RowLabel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SectionSeatGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_row_label_handles_the_26_row_boundary(): void
    {
        // The bug this replaces (AdminDashboard.jsx's `alphabet[r]`) broke exactly
        // here: alphabet[26] is undefined past row 26.
        $this->assertSame('A', RowLabel::for(0));
        $this->assertSame('Z', RowLabel::for(25));
        $this->assertSame('AA', RowLabel::for(26));
        $this->assertSame('AB', RowLabel::for(27));
        $this->assertSame('AZ', RowLabel::for(51));
        $this->assertSame('BA', RowLabel::for(52));
    }

    public function test_creating_a_section_generates_the_correct_number_of_seats_with_correct_labels(): void
    {
        $admin = User::factory()->admin()->create();
        $event = Event::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/events/{$event->id}/sections", [
                'name' => 'VIP East',
                'price' => 500000,
                'row_count' => 27, // deliberately past the 26-letter boundary
                'col_count' => 3,
                'angle_start' => -45,
                'angle_end' => 45,
                'radius_inner' => 220,
                'radius_outer' => 280,
                'color' => '#2563eb',
            ]);

        $response->assertCreated();
        $sectionId = $response->json('data.id');

        $this->assertDatabaseCount('seats', 27 * 3);
        $this->assertDatabaseHas('seats', ['section_id' => $sectionId, 'row_label' => 'A', 'seat_number' => 1, 'status' => 'available']);
        $this->assertDatabaseHas('seats', ['section_id' => $sectionId, 'row_label' => 'AA', 'seat_number' => 3, 'status' => 'available']);
    }

    public function test_the_create_response_reflects_database_defaults_not_just_the_in_memory_model(): void
    {
        // layout_type/map_angle/color have DB-level defaults; when omitted from the
        // request, Eloquent's in-memory model after create() doesn't know about
        // them unless the controller refreshes from the database.
        $admin = User::factory()->admin()->create();
        $event = Event::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/events/{$event->id}/sections", [
                'name' => 'North Stand',
                'price' => 500000,
                'row_count' => 2,
                'col_count' => 2,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.layout_type', 'bowl')
            ->assertJsonPath('data.color', '#2563eb');
    }

    public function test_a_section_cannot_be_created_without_admin_role(): void
    {
        $user = User::factory()->create();
        $event = Event::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/admin/events/{$event->id}/sections", [
                'name' => 'VIP East',
                'price' => 500000,
                'row_count' => 2,
                'col_count' => 2,
            ])
            ->assertStatus(403);
    }
}
