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
// Sections render as a continuous colored ring around a central pitch/stage
// — like an actual seating-bowl schematic — instead of separate floating
// blocks with gaps between them. Two earlier approaches (angle+radius per
// seat, then isolated wedge blocks per section) both eventually broke down:
// the first overlapped seats, the second left dead space between blocks and
// clipped off narrow screens. A donut chart is a well-understood, always-
// gap-free layout: every section gets a slice of the full circle sized by
// how many seats it has, so the ring is always complete and reads as one
// cohesive shape. Pure SVG with a viewBox, so it scales with its container
// natively — no pixel math to keep in sync with screen width at all.
export const RING_RADIUS = {
  inner: { from: 95, to: 158 },
  outer: { from: 176, to: 230 },
};
const RING_GAP_DEG = 2.5;
const MIN_SEGMENT_DEG = 14;

/**
 * Lays out every section in one ring (inner or outer) as consecutive donut
 * slices — ordered by clock_position (still a simple "roughly which side"
 * hint from admin), sized proportionally to seat count, always filling the
 * full circle with no gaps or overlaps regardless of how many sections or
 * how lopsided their seat counts are.
 *
 * @param {Array} sections
 * @param {'inner'|'outer'} ring
 * `angleOffset` staggers where the ring starts (beyond the default 12
 * o'clock) — without it, an inner and outer ring with the same section
 * count split the circle identically and their labels end up stacked on
 * the exact same ray regardless of how far apart the two radii are. A
 * small stagger between rings is what actually fixes that, not more
 * radial distance.
 *
 * @returns {Array<{ section: object, startDeg: number, endDeg: number, midDeg: number }>}
 */
export function layoutRingSegments(sections, ring, angleOffset = 0) {
  const ringSections = sections
    .filter(s => (s.ring || 'inner') === ring)
    .slice()
    .sort((a, b) => (a.clock_position || 12) - (b.clock_position || 12));

  if (ringSections.length === 0) return [];

  const totalSeats = ringSections.reduce((sum, s) => sum + (s.seats?.length || s.row_count * s.col_count || 1), 0) || 1;
  const totalGap = RING_GAP_DEG * ringSections.length;
  const availableDeg = Math.max(0, 360 - totalGap);

  let cursor = -90 + angleOffset; // mulai dari jam 12, digeser dikit
  return ringSections.map(sec => {
    const seatCount = sec.seats?.length || sec.row_count * sec.col_count || 1;
    const rawSpan = (seatCount / totalSeats) * availableDeg;
    const spanDeg = Math.max(MIN_SEGMENT_DEG, rawSpan);
    const startDeg = cursor;
    const endDeg = startDeg + spanDeg;
    cursor = endDeg + RING_GAP_DEG;
    return { section: sec, startDeg, endDeg, midDeg: (startDeg + endDeg) / 2 };
  });
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * SVG path `d` for one donut slice (a ring segment between two radii).
 */
export function donutSegmentPath(cx, cy, rInner, rOuter, startDeg, endDeg) {
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const p1 = polarToCartesian(cx, cy, rOuter, startDeg);
  const p2 = polarToCartesian(cx, cy, rOuter, endDeg);
  const p3 = polarToCartesian(cx, cy, rInner, endDeg);
  const p4 = polarToCartesian(cx, cy, rInner, startDeg);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

export { polarToCartesian };
