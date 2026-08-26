<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeatResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'section_id' => $this->section_id,
            'row_label' => $this->row_label,
            'seat_number' => $this->seat_number,
            'status' => $this->status,
            // PII — only ever included for admin requests (SeatMonitor's sold-seat detail popup).
            'guest_name' => $this->when($request->user()?->isAdmin(), $this->guest_name),
            'guest_email' => $this->when($request->user()?->isAdmin(), $this->guest_email),
        ];
    }
}
