// Single source of truth for turning a section's geometry (angle/radius from
// admin, or grid) into actual seat pixel positions. Used by both the
// customer-facing seat map (BookingPage) and the admin layout picker's
// preview, so they can never visually disagree with each other.
//
// 'bowl' sections (the default): seats fan out along an arc. If a section
// crams many rows into a small radius range, or many columns into a narrow
// angle, seats can end up closer together than their own size — that's what
// caused rows to visually overlap for tightly-packed venues (e.g. a
// conference hall configured with lots of rows). getSectionSeatSize() shrinks
// the seat marker to whatever the tightest gap in the section actually allows,
// instead of assuming a fixed size fits every geometry.
//
// 'grid' sections: straight, evenly-spaced rows/columns — the natural shape
// for a theater or conference hall floor, not curved like a stadium bowl.
// Always perfectly symmetric because spacing is fixed, not derived from an
// arc. Positioned by the same angle/radius controls as bowl sections, just
// interpreted as an anchor point (their midpoint) rather than a per-seat arc.

const MIN_SEAT_SIZE = 10;
const MAX_SEAT_SIZE = 28;
const GRID_SEAT_SIZE = 26;

export function getSectionSeatSize(section) {
  if (section.layout_type === 'grid') return GRID_SEAT_SIZE;

  const rowCount = section.row_count || 1;
  const colCount = section.col_count || 1;
  const angleStart = section.angle_start ?? -45;
  const angleEnd = section.angle_end ?? 45;
  const radiusInner = section.radius_inner ?? 200;
  const radiusOuter = section.radius_outer ?? 260;

  const angleStep = (angleEnd - angleStart) / (colCount > 1 ? colCount - 1 : 1);
  const angleStepRad = (Math.abs(angleStep) * Math.PI) / 180;

  // Radial gap between rows, and the tightest angular gap between columns
  // (smallest at the innermost radius — that's where seats are most cramped).
  const radialGap = rowCount > 1 ? (radiusOuter - radiusInner) / (rowCount - 1) : MAX_SEAT_SIZE * 1.5;
  const angularGap = radiusInner * angleStepRad || MAX_SEAT_SIZE * 1.5;

  const tightest = Math.min(radialGap, angularGap);
  return Math.max(MIN_SEAT_SIZE, Math.min(MAX_SEAT_SIZE, tightest * 0.85));
}

/**
 * @returns {{ x: number, y: number, rotation: number }}
 */
export function getSeatPosition(section, index) {
  const rowCount = section.row_count || 1;
  const colCount = section.col_count || 1;
  const row = Math.floor(index / colCount);
  const col = index % colCount;

  const angleStart = section.angle_start ?? -45;
  const angleEnd = section.angle_end ?? 45;
  const radiusInner = section.radius_inner ?? 200;
  const radiusOuter = section.radius_outer ?? 260;

  if (section.layout_type === 'grid') {
    const spacing = getSectionSeatSize(section) + 6;
    const anchorAngleRad = (((angleStart + angleEnd) / 2) * Math.PI) / 180;
    const anchorRadius = (radiusInner + radiusOuter) / 2;
    const anchorX = Math.cos(anchorAngleRad) * anchorRadius;
    const anchorY = Math.sin(anchorAngleRad) * anchorRadius;

    return {
      x: anchorX + (col - (colCount - 1) / 2) * spacing,
      y: anchorY + (row - (rowCount - 1) / 2) * spacing,
      rotation: 0,
    };
  }

  const angleStep = (angleEnd - angleStart) / (colCount > 1 ? colCount - 1 : 1);
  const angle = angleStart + col * angleStep;
  const rad = (angle * Math.PI) / 180;
  const radius = radiusInner + ((radiusOuter - radiusInner) / (rowCount > 1 ? rowCount - 1 : 1)) * row;

  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
    rotation: angle + 90,
  };
}
