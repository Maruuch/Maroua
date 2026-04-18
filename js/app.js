// ================================================================
// 🚀 APP — init globale + theme toggle
// ================================================================

(async function init() {

  // ── 1. Thème sauvegardé ────────────────────────────────────
  const savedTheme = localStorage.getItem('mj_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // ── 2. Animations ─────────────────────────────────────────
  Animations.init();

  // ── 3. Toggle thème ───────────────────────────────────────
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mj_theme', next);
  });

  // ── 4. Délégation navigation (data-page) ──────────────────
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-page]');
    if (!el) return;
    e.preventDefault();
    Store.navigate(el.dataset.page, { filter: el.dataset.filter ?? '' });
    _closeNav();
  });

  // ── 5. Nav mobile ─────────────────────────────────────────
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
    const open = mobileNav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navOverlay.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  navOverlay.addEventListener('click', _closeNav);

  // ── 6. Drawer + Checkout + Filtres + Modules ──────────────
  Drawer.init();
  Checkout.init();
  CheckoutDrawer.init();
  LegalPanel.init();
  AccountDrawer.init();
  ContactDrawer.init();
  Chat.init();
  HeroCards.init();
  Pages.initFilters();

  // ── 7. Router ─────────────────────────────────────────────
  Store.on('navigate', Pages.route);

  // ── 8. Chargement produits — splash minimum 3 secondes ───
  const loader = document.getElementById('loader');
  try {
    const [products] = await Promise.all([
      loadProducts(),
      new Promise(r => setTimeout(r, 3000))
    ]);
    Store.setProducts(products);
    Store.emit('productsLoaded');
  } catch (err) {
    console.error('Produits :', err);
    Toast.error('Impossible de charger le catalogue', 5000);
    await new Promise(r => setTimeout(r, 3000));
  }

  // ── 9. Afficher le site ───────────────────────────────────
  loader.classList.add('hidden');
  Store.navigate('home');

  // ── 10. Spin animation pour le bouton submit ──────────────
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);

})();
