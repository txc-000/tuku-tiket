<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEventRequest;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EventController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $events = Event::orderByDesc('created_at')->get();

        return EventResource::collection($events);
    }

    public function store(StoreEventRequest $request): EventResource
    {
        $event = Event::create($request->validated());

        return new EventResource($event);
    }

    public function update(UpdateEventRequest $request, Event $event): EventResource
    {
        $event->update($request->validated());

        return new EventResource($event);
    }
}
