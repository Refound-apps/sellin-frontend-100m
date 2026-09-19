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

  if (options?.updateHistory !== false) {
    try {
      window.history.pushState(null, '', `#${targetId}`);
    } catch {
      // Ignore if history state fails
    }
  }

  if (options?.immediate) {
    const html = document.documentElement;
    const prevScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo({ top: targetY, behavior: 'auto' });
    html.style.scrollBehavior = prevScrollBehavior;
    return;
  }

  // If distance is large (> 2000px):
  // Browsers (especially Chromium/WebKit) cap smooth-scroll animation duration/velocity.
  // When scrolling past dozens of loaded cards with lazy images, the smooth scroll
  // animation frequently aborts halfway through, stranding the user in the images.
  // Strategy: jump instantaneously within 600px of the target, then smooth-scroll the rest.
  if (distance > 2000) {
    const preScrollY = targetY > currentY ? targetY - 600 : targetY + 600;
    const html = document.documentElement;
    const prevScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo({ top: preScrollY, behavior: 'auto' });
    html.style.scrollBehavior = prevScrollBehavior;

    requestAnimationFrame(() => {
      const finalY = computeTargetY();
      window.scrollTo({ top: finalY, behavior: 'smooth' });
    });
  } else {
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  // Double-check verification:
  // If lazy-loaded images, fonts, or mobile menu collapse caused layout shift,
  // or if browser smooth-scroll was cut short, re-align smoothly to the exact target.
  const verifyArrival = () => {
    const currentEl = document.getElementById(targetId);
    if (!currentEl) return;
    const currentTop = currentEl.getBoundingClientRect().top;
    const diff = currentTop - totalOffset;
    if (Math.abs(diff) > 35) {
      const correctedY = computeTargetY();
      window.scrollTo({ top: correctedY, behavior: 'smooth' });
    }
  };

  setTimeout(verifyArrival, 300);
  setTimeout(verifyArrival, 600);
}
