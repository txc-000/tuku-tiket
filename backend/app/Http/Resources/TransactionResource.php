<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
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
            'event_id' => $this->event_id,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'total_amount' => (float) $this->total_amount,
            'payment_status' => $this->payment_status,
            'created_at' => $this->created_at?->toIso8601String(),
            'event' => new EventResource($this->whenLoaded('event')),
        ];
    }
}
