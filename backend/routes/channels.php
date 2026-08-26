<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function (User $user, int $id) {
    return $user->id === $id;
});

// Seat availability is already publicly visible on the booking page, so the
// event.*.seats / section.*.seats public channels need no authorization here.

Broadcast::channel('admin.dashboard', function (User $user) {
    return $user->isAdmin();
});
