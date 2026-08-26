<?php

namespace Tests\Feature;

use App\Models\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_event_listing_only_returns_published_events(): void
    {
        Event::factory()->published()->create(['title' => 'Published Event']);
        Event::factory()->create(['title' => 'Draft Event', 'status' => 'draft']);

        $response = $this->getJson('/api/events');

        $response->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame('Published Event', $response->json('data.0.title'));
    }

    public function test_a_draft_event_is_not_publicly_viewable(): void
    {
        $event = Event::factory()->create(['status' => 'draft']);

        $this->getJson("/api/events/{$event->id}")->assertStatus(404);
    }

    public function test_a_published_event_is_publicly_viewable(): void
    {
        $event = Event::factory()->published()->create();

        $this->getJson("/api/events/{$event->id}")->assertOk();
    }
}
