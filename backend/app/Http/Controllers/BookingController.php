<?php

namespace App\Http\Controllers;

use App\Events\SeatStatusUpdated;
use App\Events\TransactionUpdated;
use App\Exceptions\SeatUnavailableException;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Seat;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /**
     * @throws SeatUnavailableException
     */
    public function store(StoreBookingRequest $request): JsonResponse
    {
        $seatIds = $request->validated('seat_ids');
        $user = $request->user('sanctum');

        $customerName = $request->validated('customer_name') ?? $user?->full_name;
        $customerEmail = $request->validated('customer_email') ?? $user?->email;

        $transaction = DB::transaction(function () use ($request, $seatIds, $customerName, $customerEmail) {
            // Stable lock order (by id) avoids two overlapping bookings deadlocking
            // each other; lockForUpdate() holds the row lock until this transaction
            // commits, so a concurrent request for any of these seats blocks here
            // instead of racing past a stale "available" read.
            $seats = Seat::whereIn('id', $seatIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($seats->count() !== count($seatIds) || $seats->contains(fn (Seat $seat) => $seat->status !== 'available')) {
                throw new SeatUnavailableException;
            }

            // Recompute the total from each seat's section price — never trust a
            // client-supplied total.
            $totalAmount = $seats->load('section')->sum(fn (Seat $seat) => $seat->section->price);

            $transaction = Transaction::create([
                'event_id' => $request->validated('event_id'),
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'total_amount' => $totalAmount,
                'payment_status' => 'pending',
            ]);

            Seat::whereIn('id', $seatIds)->update([
                'status' => 'sold',
                'transaction_id' => $transaction->id,
                'guest_name' => $customerName,
                'guest_email' => $customerEmail,
            ]);

            return $transaction;
        });

        // Broadcast after commit, outside the transaction, so a broadcast hiccup
        // can never roll back a real booking.
        Seat::whereIn('id', $seatIds)->get()->each(fn (Seat $seat) => broadcast(new SeatStatusUpdated($seat)));

        return (new TransactionResource($transaction->load('event')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Simulate a payment gateway confirming the transaction — this app has no
     * real payment integration, the frontend calls this a few seconds after
     * `store()` to flip pending -> paid, matching the old client-side setTimeout
     * simulation it's replacing.
     */
    public function simulatePayment(Transaction $transaction): TransactionResource
    {
        $transaction->update(['payment_status' => 'paid']);

        broadcast(new TransactionUpdated($transaction));

        return new TransactionResource($transaction);
    }
}
