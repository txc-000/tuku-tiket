<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
            'color' => ['nullable', 'string', 'max:32'],
            'view_image' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
