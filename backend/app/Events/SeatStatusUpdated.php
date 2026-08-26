<?php

namespace App\Events;

use App\Models\Seat;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// ShouldBroadcastNow (not ShouldBroadcast) — broadcasts synchronously instead
// of going through the queue, so this app never needs a `queue:work` process
// running just to keep seat status live. Broadcast volume here is low enough
// that the request/response latency cost is negligible.
class SeatStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Seat $seat) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("event.{$this->seat->section->event_id}.seats"),
            new Channel("section.{$this->seat->section_id}.seats"),
            new PrivateChannel('admin.dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'seat.updated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        // Public channels above — deliberately exclude guest_name/guest_email (PII).
        return $this->seat->only(['id', 'section_id', 'status', 'row_label', 'seat_number']);
    }
}
