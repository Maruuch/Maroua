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
  function renderCatalog(filter = '') {
    showPage('catalog');

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
