<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Http\Resources\SectionResource;
use App\Models\Event;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EventController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $events = Event::published()->orderBy('date')->get();

        return EventResource::collection($events);
    }

    public function show(Event $event): EventResource
    {
        abort_unless($event->status === 'published', 404);

        return new EventResource($event);
    }

    public function sections(Event $event): AnonymousResourceCollection
    {
        abort_unless($event->status === 'published', 404);

        $sections = $event->sections()->with('seats')->get();

        return SectionResource::collection($sections);
    }
}
