<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Guests must supply their own name/email (no more silent fallback to a
        // fake "pembeli@example.com"); logged-in users get theirs from the
        // account, but may still override the display name/email if they wish.
        $isGuest = ! $this->user('sanctum');

        return [
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'seat_ids' => ['required', 'array', 'min:1'],
            'seat_ids.*' => ['integer', 'distinct', 'exists:seats,id'],
            'customer_name' => [Rule::requiredIf($isGuest), 'nullable', 'string', 'max:255'],
            'customer_email' => [Rule::requiredIf($isGuest), 'nullable', 'email', 'max:255'],
        ];
    }
}
