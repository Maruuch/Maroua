// ================================================================
// 🚀 APP — point d'entrée, initialisation globale
// ================================================================

(async function init() {

  // ── 1. Animations + header ─────────────────────────────────
  Animations.init();

  // ── 2. Navigation par délégation (data-page) ───────────────
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-page]');
    if (!el) return;
    e.preventDefault();
    const page   = el.dataset.page;
    const filter = el.dataset.filter ?? '';
    Store.navigate(page, { filter });

    // Fermer nav mobile si ouvert
    _closeNav();
  });

  // ── 3. Nav mobile ──────────────────────────────────────────
  const navToggle  = document.getElementById('navToggle');
  const mobileNav  = document.getElementById('mobileNav');
  const navOverlay = document.getElementById('navOverlay');

  function _closeNav() {
    navToggle.classList.remove('open');
    mobileNav.classList.remove('open');
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navOverlay.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  navOverlay.addEventListener('click', _closeNav);

  // ── 4. Drawer panier ───────────────────────────────────────
  Drawer.init();

  // ── 5. Checkout ────────────────────────────────────────────
  Checkout.init();

  // ── 6. Filtres catalog ─────────────────────────────────────
  Pages.initFilters();

  // ── 7. Router (réagit aux changements d'état) ──────────────
  Store.on('navigate', Pages.route);

  // ── 8. Chargement produits ─────────────────────────────────
  const loader = document.getElementById('loader');

  try {
    const products = await loadProducts();   // défini dans config.js
    Store.setProducts(products);
  } catch (err) {
    console.error('Erreur produits :', err);
    Toast.error('Impossible de charger le catalogue', 5000);
  }

  // ── 9. Masquer le loader + afficher la home ────────────────
  loader.classList.add('hidden');
  Store.navigate('home');

  // ── 10. Animation CSS spin (pour le bouton checkout) ───────
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);

})();
