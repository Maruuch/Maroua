// ================================================================
// 🚀 APP — init globale + theme toggle
// ================================================================

(async function init() {

  // ── 1. Thème sauvegardé ────────────────────────────────────
  const savedTheme = localStorage.getItem('mj_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // ── 1bis. Fallback logo : si une image logo échoue (404),
  //         on bascule le conteneur sur le texte stylé.
  document.querySelectorAll('.logo-img, .nav-logo .logo-img').forEach(img => {
    img.addEventListener('error', () => {
      const wrap = img.closest('.logo, .nav-logo');
      if (wrap) wrap.classList.add('logo--no-img');
    }, { once: true });
  });

  // ── 1ter. Sync auto header ↔ fond du logo ─────────────────
  //   Pipette un pixel du PNG visible et propage la couleur
  //   en CSS var (--header-bg / --header-solid) sur :root,
  //   pour que toutes les règles existantes l'utilisent.
  // Helper : échantillonne un pixel coin d'une image et renvoie "rgb(r,g,b)"
  function _sampleLogoColor(img, cb) {
    if (!img) return;
    const run = () => {
      if (!img.naturalWidth) return;
      try {
        if (!img.crossOrigin) {
          img.crossOrigin = 'anonymous';
          const src = img.src;
          img.src = '';
          img.src = src;
          img.addEventListener('load', run, { once: true });
          return;
        }
        const c = document.createElement('canvas');
        c.width  = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        const p = c.getContext('2d').getImageData(3, 3, 1, 1).data;
        cb(`rgb(${p[0]}, ${p[1]}, ${p[2]})`);
      } catch (e) {
        console.warn('[logo-sync] sample fail:', e.message);
      }
    };
    if (img.complete && img.naturalWidth) run();
    else img.addEventListener('load', run, { once: true });
  }

  function _syncHeaderToLogo() {
    const theme = document.documentElement.getAttribute('data-theme');
    // Header : logo qui matche le thème (cf. règle CSS data-theme)
    const headerLogo = document.querySelector(
      `.logo .logo-img--${theme === 'dark' ? 'dark' : 'light'}`
    );
    console.log('[header-sync] theme=', theme, 'logo=', headerLogo?.currentSrc || headerLogo?.src);
    _sampleLogoColor(headerLogo, color => {
      document.documentElement.style.setProperty('--header-bg',    color);
      document.documentElement.style.setProperty('--header-solid', color);
      console.log('[header-sync] header bg =', color);
    });
  }

  function _syncSidePanelToLogo() {
    // Side panel : on force light_logo (toujours fond espresso, peu importe le thème)
    const sideLogo = document.querySelector('.nav-logo .logo-img--light');
    _sampleLogoColor(sideLogo, color => {
      document.documentElement.style.setProperty('--nav-logo-bg', color);
      console.log('[side-sync] nav-logo bg =', color);
    });
  }

  _syncHeaderToLogo();
  _syncSidePanelToLogo();
  new MutationObserver(_syncHeaderToLogo).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ['data-theme'] }
  );

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
