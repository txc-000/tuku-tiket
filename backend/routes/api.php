<?php

use App\Http\Controllers\Admin\CheckinController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\SeatController as AdminSeatController;
use App\Http\Controllers\Admin\SectionController as AdminSectionController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\MyTicketController;
use Illuminate\Support\Facades\Route;

// Public
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event}', [EventController::class, 'show']);
Route::get('/events/{event}/sections', [EventController::class, 'sections']);

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});

// Booking (public, optionally authenticated — guest checkout is allowed)
Route::post('/transactions', [BookingController::class, 'store']);
Route::post('/transactions/{transaction}/simulate-payment', [BookingController::class, 'simulatePayment']);

// My tickets
Route::middleware('auth:sanctum')->get('/my-tickets', [MyTicketController::class, 'index']);

// Admin
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/events', [AdminEventController::class, 'index']);
    Route::post('/events', [AdminEventController::class, 'store']);
    Route::put('/events/{event}', [AdminEventController::class, 'update']);

    Route::get('/events/{event}/sections', [AdminSectionController::class, 'index']);
    Route::post('/events/{event}/sections', [AdminSectionController::class, 'store']);

    Route::get('/sections/{section}/seats', [AdminSeatController::class, 'index']);
    Route::patch('/seats/{seat}/toggle-block', [AdminSeatController::class, 'toggleBlock']);
    Route::delete('/seats/{seat}', [AdminSeatController::class, 'destroy']);

    Route::get('/transactions', [AdminTransactionController::class, 'index']);

    Route::post('/checkin', [CheckinController::class, 'store']);
});
