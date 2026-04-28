// ================================================================
// 📄 PAGES — rendu de chaque vue
// ================================================================

const Pages = (() => {

  // ── Références DOM ──────────────────────────────────────────
  const $ = id => document.getElementById(id);

  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = $('page' + pageId.charAt(0).toUpperCase() + pageId.slice(1));
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => Animations.refreshReveal(), 50);
    }
  }

  // ── HOME ────────────────────────────────────────────────────
  function renderHome() {
    showPage('home');
    const grid = $('featuredGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const featured = Store.getProducts()
      .filter(p => p.tag === 'Bestseller' || p.tag === 'Nouveau')
      .slice(0, 4);

    const toShow = featured.length ? featured : Store.getProducts().slice(0, 4);
    toShow.forEach((p, i) => grid.appendChild(Components.productCard(p, i * 80)));
  }

  // ── CATALOG ─────────────────────────────────────────────────
  // Conventions images headers :
  //   • Cas par catégorie : /images/categories/header_<MODE>_<CAT>.png
  //   • Cas Tout (toutes) : /images/categories/<MODE>_header.png
  // Effet : Ken Burns subtil en boucle (zoom doux 1.04 → 1.10).
  const CATALOG_HEADERS = {
    '': {
      eyebrow: 'Maroua Jewelry',
      title:   'Collection',
      sub:     "L'ensemble de nos pièces — pensées pour s'inscrire dans la durée.",
      dark:    '/images/categories/dark_header.png',
      light:   '/images/categories/light_header.png',
    },
    'collier':  {
      eyebrow: '01 / Collection',
      title:   'Colliers',
      sub:     "Élégance au fil de l'or — pièces uniques et chaînes signature.",
      dark:    '/images/categories/header_dark_col.png',
      light:   '/images/categories/header_light_col.png',
    },
    'bracelet': {
      eyebrow: '02 / Collection',
      title:   'Bracelets',
      sub:     'Grâce au poignet — joncs, gourmettes et fils tressés.',
      dark:    '/images/categories/header_dark_bra.png',
      light:   '/images/categories/header_light_bra.png',
    },
    'bague':    {
      eyebrow: '03 / Collection',
      title:   'Bagues',
      sub:     "Symboles d'éternité — solitaires, joncs et signatures.",
      dark:    '/images/categories/header_dark_bag.png',
      light:   '/images/categories/header_light_bag.png',
    },
    'boucle':   {
      eyebrow: '04 / Collection',
      title:   "Boucles d'oreilles",
      sub:     'Dormeuses, créoles & piercings — la lumière près du visage.',
      dark:    '/images/categories/header_dark_bou.png',
      light:   '/images/categories/header_light_bou.png',
    },
    'pack':     {
      eyebrow: '05 / Collection',
      title:   'Packs',
      sub:     "L'ensemble parfait, pensé d'une seule main.",
      dark:    '/images/categories/header_dark_pac.png',
      light:   '/images/categories/header_light_pac.png',
    },
  };

  function _applyCatalogHero(filter) {
    const hero    = $('catalogHero');
    if (!hero) return;
    const conf    = CATALOG_HEADERS[filter] || CATALOG_HEADERS[''];
    const eyebrow = $('catalogEyebrow');
    const title   = $('catalogTitle');
    const sub     = $('catalogSub');

    // Mise à jour textes
    if (eyebrow) eyebrow.textContent = conf.eyebrow;
    if (title)   title.textContent   = conf.title;
    if (sub)     sub.textContent     = conf.sub;

    // Injection des 2 CSS vars (1 image par thème)
    hero.style.setProperty('--cat-hero-d', `url('${conf.dark}')`);
    hero.style.setProperty('--cat-hero-l', `url('${conf.light}')`);
    hero.classList.remove('no-media');

    // Mini-particules dorées — petites, lentes, discrètes
    _spawnCatalogSparks();
  }

  function _spawnCatalogSparks() {
    const wrap = $('catalogSparks');
    if (!wrap) return;
    wrap.innerHTML = '';
    const count = window.innerWidth < 640 ? 12 : 24;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'cat-spark';
      const dur = 4 + Math.random() * 8;
      s.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-duration: ${dur}s;
        animation-delay: ${-Math.random() * dur}s;
        width: ${1 + Math.random() * 2}px;
        height: ${1 + Math.random() * 2}px;
        opacity: ${0.3 + Math.random() * 0.5};
      `;
      wrap.appendChild(s);
    }
  }

  function renderCatalog(filter = '') {
    showPage('catalog');

    // Hero immersif (image + texte)
    _applyCatalogHero(filter);

    // Sync filtres
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    const grid     = $('catalogGrid');
    const emptyEl  = $('emptyState');
    grid.innerHTML = '';

    const all      = Store.getProducts();
    const filtered = filter ? all.filter(p => p.type === filter) : all;

    if (!filtered.length) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    filtered.forEach((p, i) => grid.appendChild(Components.productCard(p, i * 60)));
  }

  // ── PRODUCT ─────────────────────────────────────────────────
  function renderProduct(productId) {
    showPage('product');
    const container = $('productDetail');
    container.innerHTML = '';

    const p = Store.getProduct(productId);
    if (!p) {
      container.innerHTML = '<p style="color:var(--text-muted);padding:3rem 0">Produit introuvable.</p>';
      return;
    }
    container.appendChild(Components.productDetail(p));

    // Historique : enregistre APRES rendu, pour éviter d'apparaître dans sa propre section
    try { RecentlyViewed.push(p.id); } catch {}

    // Section "Derniers produits consultés" (exclut le produit actuel)
    const recentList = RecentlyViewed.products(p.id, 6);
    const recentSection = Components.recentlyViewedSection(recentList);
    const recentHost = $('recentlyViewed');
    if (recentHost) {
      recentHost.innerHTML = '';
      if (recentSection) recentHost.appendChild(recentSection);
    }

    $('backBtn').onclick = () => Store.navigate('catalog', { filter: p.type });
  }

  // ── CHECKOUT ────────────────────────────────────────────────
  function renderCheckout() {
    if (!Cart.canCheckout()) {
      Store.navigate('home');
      return;
    }
    showPage('checkout');
    Checkout.render();
  }

  // ── SUCCESS ─────────────────────────────────────────────────
  function renderSuccess() {
    showPage('success');
  }

  // ── LIVRAISON ────────────────────────────────────────────────
  function renderLivraison() { showPage('livraison'); }

  // ── CGV ──────────────────────────────────────────────────────
  function renderCgv() { showPage('cgv'); }

  // ── CONTACT ──────────────────────────────────────────────────
  function renderContact() { showPage('contact'); }

  // ── CERTIFICATION ─────────────────────────────────────────────
  function renderCertification() { showPage('certification'); }

  // ── Router ──────────────────────────────────────────────────
  function route({ page, filter, currentProductId }) {
    switch (page) {
      case 'home':          renderHome(); break;
      case 'catalog':       renderCatalog(filter); break;
      case 'product':       renderProduct(currentProductId); break;
      case 'checkout':      renderCheckout(); break;
      case 'success':       renderSuccess(); break;
      case 'livraison':     renderLivraison(); break;
      case 'cgv':           renderCgv(); break;
      case 'contact':       renderContact(); break;
      case 'certification': renderCertification(); break;
      default:              renderHome();
    }
  }

  // ── Filtres catalog ─────────────────────────────────────────
  function initFilters() {
    $('filters').addEventListener('click', e => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      Store.navigate('catalog', { filter: btn.dataset.filter });
    });
  }

  return { route, initFilters };
})();
