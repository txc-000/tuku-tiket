<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MyTicketResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Keys mirror the old Supabase nested-select shape the frontend already
        // renders against (`sections`, `transactions.events`) so MyTickets.jsx's
        // JSX doesn't need to change, just where the data comes from.
        return [
            'id' => $this->id,
            'row_label' => $this->row_label,
            'seat_number' => $this->seat_number,
            'sections' => [
                'name' => $this->section->name,
                'floor_name' => $this->section->floor_name,
                'price' => (float) $this->section->price,
            ],
            'transactions' => [
                'customer_email' => $this->transaction->customer_email,
                'payment_status' => $this->transaction->payment_status,
                'events' => [
                    'title' => $this->transaction->event->title,
                    'date' => $this->transaction->event->date?->toDateString(),
                    'venue' => $this->transaction->event->venue,
                    'image' => $this->transaction->event->image,
                    'theme_color' => $this->transaction->event->theme_color,
                ],
            ],
        ];
    }
}
