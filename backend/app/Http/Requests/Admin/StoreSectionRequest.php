<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'floor_name' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0'],
            'row_count' => ['required', 'integer', 'min:1', 'max:100'],
            'col_count' => ['required', 'integer', 'min:1', 'max:100'],
            'layout_type' => ['sometimes', Rule::in(['bowl', 'orchestra', 'grid'])],
            // Geometry — drives the visual position on the seat map. Nullable
            // because 'orchestra'/'grid' layouts use map_angle instead.
            'angle_start' => ['nullable', 'integer', 'between:-360,360'],
            'angle_end' => ['nullable', 'integer', 'between:-360,360'],
            'radius_inner' => ['nullable', 'integer', 'min:0'],
            'radius_outer' => ['nullable', 'integer', 'min:0'],
            'map_angle' => ['nullable', 'integer', 'between:-360,360'],
            'color' => ['nullable', 'string', 'max:32'],
            'view_image' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
