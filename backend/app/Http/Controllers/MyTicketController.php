<?php

namespace App\Http\Controllers;

use App\Http\Resources\MyTicketResource;
use App\Models\Seat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MyTicketController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $seats = Seat::query()
            ->whereHas('transaction', function ($query) use ($request) {
                $query->where('customer_email', $request->user()->email);
            })
            ->with(['section', 'transaction.event'])
            ->orderByDesc('id')
            ->get();

        return MyTicketResource::collection($seats);
    }
}
