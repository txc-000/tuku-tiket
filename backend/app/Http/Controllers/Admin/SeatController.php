<?php

namespace App\Http\Controllers\Admin;

use App\Events\SeatStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\SeatResource;
use App\Models\Seat;
use App\Models\Section;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class SeatController extends Controller
{
    public function index(Section $section): AnonymousResourceCollection
    {
        $seats = $section->seats()->orderBy('row_label')->orderBy('seat_number')->get();

        return SeatResource::collection($seats);
    }

    public function toggleBlock(Seat $seat): SeatResource
    {
        $seat->update([
            'status' => $seat->status === 'blocked' ? 'available' : 'blocked',
        ]);

        broadcast(new SeatStatusUpdated($seat));

        return new SeatResource($seat);
    }

    public function destroy(Seat $seat): Response
    {
        $seat->delete();

        return response()->noContent();
    }
}
