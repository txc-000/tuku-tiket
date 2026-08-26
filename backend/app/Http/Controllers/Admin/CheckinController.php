<?php

namespace App\Http\Controllers\Admin;

use App\Events\SeatStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CheckinRequest;
use App\Http\Resources\SeatResource;
use App\Models\Seat;
use Illuminate\Http\JsonResponse;

class CheckinController extends Controller
{
    public function store(CheckinRequest $request): JsonResponse
    {
        $seat = Seat::with(['section', 'transaction.event'])->findOrFail($request->validated('seat_id'));

        if ($seat->status === 'checked-in') {
            return response()->json(['message' => 'Tiket ini sudah digunakan untuk check-in!'], 409);
        }

        if ($seat->status !== 'sold') {
            return response()->json(['message' => 'Status tiket tidak valid (belum lunas).'], 422);
        }

        $seat->update(['status' => 'checked-in']);

        broadcast(new SeatStatusUpdated($seat));

        return response()->json([
            'message' => 'Check-in berhasil! Silakan masuk.',
            'seat' => new SeatResource($seat),
            'section' => ['name' => $seat->section->name, 'floor_name' => $seat->section->floor_name],
            'customer_name' => $seat->transaction?->customer_name,
            'event_title' => $seat->transaction?->event?->title,
        ]);
    }
}
