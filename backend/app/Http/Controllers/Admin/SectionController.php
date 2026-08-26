<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Resources\SectionResource;
use App\Models\Event;
use App\Models\Seat;
use App\Support\RowLabel;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class SectionController extends Controller
{
    public function index(Event $event): AnonymousResourceCollection
    {
        $sections = $event->sections()->orderBy('floor_name')->get();

        return SectionResource::collection($sections);
    }

    public function store(StoreSectionRequest $request, Event $event): SectionResource
    {
        $section = DB::transaction(function () use ($request, $event) {
            $section = $event->sections()->create($request->validated());

            $seats = [];

            for ($row = 0; $row < $section->row_count; $row++) {
                $rowLabel = RowLabel::for($row);

                for ($col = 1; $col <= $section->col_count; $col++) {
                    $seats[] = [
                        'section_id' => $section->id,
                        'row_label' => $rowLabel,
                        'seat_number' => $col,
                        'status' => 'available',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            foreach (array_chunk($seats, 500) as $chunk) {
                Seat::insert($chunk);
            }

            // `color` has a DB-level default that isn't part of the insert
            // payload when omitted — refresh so the response reflects what
            // Postgres actually stored, not an in-memory model missing it.
            return $section->refresh();
        });

        return new SectionResource($section);
    }
}
