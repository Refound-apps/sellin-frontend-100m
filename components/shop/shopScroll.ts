/**
 * Utility for safe, accurate smooth scrolling to shop sections.
 * Resolves browser smooth-scroll truncations over large DOM distances (e.g. 50+ loaded cards),
 * layout shifts from mobile hamburger menus, and sticky header overlaps.
 */

export function scrollToShopSection(
  sectionId: string,
  options?: { immediate?: boolean; updateHistory?: boolean }
) {
  if (typeof window === 'undefined') return;

  const targetId = sectionId.replace(/^#/, '');
  const el = document.getElementById(targetId);
  if (!el) return;

  // Header offset: header is sticky (approx 56-68px)
  const header = document.querySelector('header');
  const headerHeight = header ? header.getBoundingClientRect().height : 64;
  // Offset below sticky header with comfortable spacing
  const totalOffset = headerHeight + 16;

  const computeTargetY = () => {
    const currentEl = document.getElementById(targetId);
    if (!currentEl) return 0;
    const rect = currentEl.getBoundingClientRect();
    return Math.max(0, Math.round(rect.top + window.scrollY - totalOffset));
  };

  const targetY = computeTargetY();
  const currentY = window.scrollY;
  const distance = Math.abs(targetY - currentY);

  if (options?.updateHistory === true) {
    try {
      window.history.pushState(null, '', `#${targetId}`);
    } catch {
      // Ignore if history state fails
    }
  }

  if (options?.immediate) {
    window.scrollTo({ top: targetY, behavior: 'auto' });
    return;
  }

  window.scrollTo({ top: targetY, behavior: 'smooth' });
}
