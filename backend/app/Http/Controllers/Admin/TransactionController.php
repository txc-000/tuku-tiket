<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Seat;
use App\Models\Transaction;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TransactionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $transactions = Transaction::with('event')->orderByDesc('created_at')->get();

        $totalRevenue = (float) $transactions->where('payment_status', 'paid')->sum('total_amount');
        $totalSold = Seat::whereIn('status', ['sold', 'checked-in'])->count();

        return TransactionResource::collection($transactions)->additional([
            'stats' => [
                'total_revenue' => $totalRevenue,
                'total_sold' => $totalSold,
            ],
        ]);
    }
}
