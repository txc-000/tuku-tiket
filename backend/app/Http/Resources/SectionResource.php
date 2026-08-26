<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SectionResource extends JsonResource
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
            'name' => $this->name,
            'floor_name' => $this->floor_name,
            'price' => (float) $this->price,
            'row_count' => $this->row_count,
            'col_count' => $this->col_count,
            'color' => $this->color,
            'clock_position' => $this->clock_position,
            'ring' => $this->ring,
            'view_image' => $this->view_image,
            'seats' => SeatResource::collection($this->whenLoaded('seats')),
        ];
    }
}
