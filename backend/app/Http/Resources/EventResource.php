<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
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
            'title' => $this->title,
            'date' => $this->date?->toDateString(),
            'venue' => $this->venue,
            'price' => (float) $this->price,
            'category' => $this->category,
            'image' => $this->image,
            'status' => $this->status,
            'theme_color' => $this->theme_color,
            'sections' => SectionResource::collection($this->whenLoaded('sections')),
        ];
    }
}
