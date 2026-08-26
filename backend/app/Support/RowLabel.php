<?php

namespace App\Support;

class RowLabel
{
    /**
     * Excel-style row label for a zero-based row index: 0 => A, 25 => Z,
     * 26 => AA, 27 => AB, ... Replaces the frontend's old `alphabet[r]` lookup
     * (in AdminDashboard.jsx), which silently broke for any section with more
     * than 26 rows.
     */
    public static function for(int $index): string
    {
        $n = $index + 1;
        $label = '';

        while ($n > 0) {
            $remainder = ($n - 1) % 26;
            $label = chr(65 + $remainder).$label;
            $n = intdiv($n - 1, 26);
        }

        return $label;
    }
}
