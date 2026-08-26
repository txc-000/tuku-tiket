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
            'layout_type' => $this->layout_type,
            'angle_start' => $this->angle_start,
            'angle_end' => $this->angle_end,
            'radius_inner' => $this->radius_inner,
            'radius_outer' => $this->radius_outer,
            'map_angle' => $this->map_angle,
            'color' => $this->color,
            'view_image' => $this->view_image,
            'seats' => SeatResource::collection($this->whenLoaded('seats')),
        ];
    }
}
