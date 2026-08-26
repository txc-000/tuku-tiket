// Straight cinema-style seat grid (like XXI) — one section shown at a time,
// rows laid out top to bottom, seats left to right. No curved/positioned
// math at all, so a section can never render with overlapping or unevenly
// spaced seats regardless of how many rows or columns it has.

export const SEAT_SIZE = 30;
export const SEAT_GAP = 8;

/**
 * @returns {{ row: number, col: number }}
 */
export function getSeatGridCoords(section, index) {
  const colCount = section.col_count || 1;
  return {
    row: Math.floor(index / colCount),
    col: index % colCount,
  };
}

/**
 * Pixel position for an absolutely-positioned canvas (SeatMonitor's pannable
 * view) — BookingPage renders rows with plain flexbox instead and doesn't
 * need this, but a free-pan/zoom canvas needs explicit x/y per seat.
 * @returns {{ x: number, y: number }}
 */
export function getSeatPixelPosition(section, index) {
  const colCount = section.col_count || 1;
  const { row, col } = getSeatGridCoords(section, index);
  const spacing = SEAT_SIZE + SEAT_GAP;
  return {
    x: (col - (colCount - 1) / 2) * spacing,
    y: row * spacing,
  };
}

// --- Venue overview map (the zone picker shown before the seat grid) ---
// Each section is one block placed around a central pitch/stage by a clock
// position (1-12, like a clock face) and a near/far ring — coarse, one-click
// admin input, and completely separate from the seat grid above, so it can
// never reintroduce per-seat overlap bugs.
export const MAP_RING_RADIUS = { inner: 190, outer: 320 };

/**
 * @returns {{ x: number, y: number, angleDeg: number }}
 */
export function getSectionMapPosition(section) {
  const clockPosition = section.clock_position || 12;
  const radius = MAP_RING_RADIUS[section.ring] ?? MAP_RING_RADIUS.inner;
  const angleDeg = clockPosition * 30 - 90; // 12 o'clock -> straight up

  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
    angleDeg,
  };
}
