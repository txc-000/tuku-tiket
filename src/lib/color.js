// Darkens a "#rrggbb" hex color by the given amount (0-1). Used to derive a
// section's border color from its single admin-picked accent color.
export function darken(hex, amount = 0.25) {
  const clean = hex?.replace('#', '') || '475569';
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);

  const r = Math.max(0, Math.floor(((num >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 255) * (1 - amount)));

  return `rgb(${r}, ${g}, ${b})`;
}
