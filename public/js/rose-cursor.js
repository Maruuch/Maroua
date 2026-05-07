/* ================================================================
   rose-cursor.js — petit halo rose qui suit la souris
   ----------------------------------------------------------------
   - Désactivé sur tactile / pointer coarse (mobile, tablet)
   - Désactivé si prefers-reduced-motion
   - Lerp léger pour que ça suive avec une légère traîne (pas saccadé)
   - Grossit sur les éléments interactifs
   ================================================================ */
(() => {
  'use strict';

  const isCoarsePointer = window.matchMedia('(pointer: coarse), (hover: none)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isCoarsePointer || prefersReducedMotion) return;

  // Création de l'élément
  const cursor = document.createElement('div');
  cursor.className = 'rose-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursor);

  // État
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  const lerp = 0.18; // 0 = lent, 1 = instant

  // Sélecteurs des éléments "interactifs" → cursor grossit
  const HOVER_SELECTOR = 'a, button, input, textarea, select, [role="button"], .product-card, .acc-nav-btn, .header-icon-btn, .drawer-close';

  // Listeners
  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!cursor.classList.contains('is-active')) {
      cursor.classList.add('is-active');
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    cursor.classList.remove('is-active');
  });

  document.addEventListener('mouseover', (e) => {
    if (e.target && typeof e.target.closest === 'function' && e.target.closest(HOVER_SELECTOR)) {
      cursor.classList.add('is-hovering');
    } else {
      cursor.classList.remove('is-hovering');
    }
  }, { passive: true });

  // Boucle d'animation avec interpolation
  function tick() {
    currentX += (targetX - currentX) * lerp;
    currentY += (targetY - currentY) * lerp;
    cursor.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
