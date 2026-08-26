export function isDemoMode() {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}

/**
 * Call at the top of a mutating handler (booking submit, login/register submit).
 * Returns true (and alerts the user) if the action should be blocked.
 */
export function guardDemo(message = 'Fitur ini hanya aktif di instalasi lokal — ini cuma demo tampilan.') {
  if (isDemoMode()) {
    alert(message);
    return true;
  }
  return false;
}
