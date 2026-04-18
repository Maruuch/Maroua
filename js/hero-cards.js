// ================================================================
// 🃏 HERO CARDS — auto-scroll par tag, pause hover
// ================================================================

const HeroCards = (() => {

  let newIdx = 0;
  let favIdx = 0;
  let newTimer = null;
  let favTimer = null;

  function _getByTag(tag) {
    return Store.getProducts().filter(p =>
      p.tag === tag && p.stock > 0
    );
  }

  function _updateCard(cardEl, product) {
    if (!cardEl || !product) return;
    const imgEl = cardEl.querySelector('.hero-card-img');
    const phEl  = cardEl.querySelector('.hero-card-placeholder');
    const nameEl = cardEl.querySelector('.hero-card-name');
    const priceEl = cardEl.querySelector('.hero-card-price');

    const src = (product.images && product.images.length > 0)
      ? product.images[0]
      : `/images/${product.id}.webp`;

    nameEl.textContent  = product.name;
    priceEl.textContent = `${product.price.toLocaleString()} MAD`;

    const img = new Image();
    img.onload = () => {
      imgEl.src = src;
      imgEl.style.display = 'block';
      if (phEl) phEl.style.display = 'none';
    };
    img.onerror = () => {
      imgEl.style.display = 'none';
      if (phEl) phEl.style.display = 'flex';
    };
    img.src = src;
  }

  function _startCard(cardEl, products, getIdx, setIdx, interval) {
    if (!cardEl || !products.length) return null;
    _updateCard(cardEl, products[getIdx()]);

    const timer = setInterval(() => {
      const paused = cardEl.dataset.paused === '1';
      if (paused) return;
      setIdx((getIdx() + 1) % products.length);
      _updateCard(cardEl, products[getIdx()]);
    }, interval);

    cardEl.addEventListener('mouseenter', () => { cardEl.dataset.paused = '1'; });
    cardEl.addEventListener('mouseleave', () => { cardEl.dataset.paused = '0'; });

    // Clic → naviguer vers le produit
    cardEl.addEventListener('click', () => {
      const prods = products;
      const p = prods[getIdx()];
      if (p) Store.navigate('product', { productId: p.id });
    });

    return timer;
  }

  function init() {
    // Attendre que les produits soient chargés
    Store.on('productsLoaded', () => {
      const cardNew = document.getElementById('heroCardNew');
      const cardFav = document.getElementById('heroCardFav');

      const newProds = _getByTag('Nouveau');
      const favProds = _getByTag('Bestseller');

      // Fallback si tags vides : prendre n'importe quels produits
      const pNew = newProds.length ? newProds : Store.getProducts().slice(0, 3);
      const pFav = favProds.length ? favProds : Store.getProducts().slice(1, 4);

      if (newTimer) clearInterval(newTimer);
      if (favTimer) clearInterval(favTimer);

      newTimer = _startCard(
        cardNew, pNew,
        () => newIdx, (i) => { newIdx = i; },
        3200
      );
      favTimer = _startCard(
        cardFav, pFav,
        () => favIdx, (i) => { favIdx = i; },
        4100
      );
    });
  }

  return { init };
})();
