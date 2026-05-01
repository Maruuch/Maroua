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

  // ── Tilt 3D au mouvement souris (parallaxe interactive) ──
  function _initTilt() {
    document.querySelectorAll('.hero-card').forEach(card => {
      let raf = null;
      const reset = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
        });
      };
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;   // 0 → 1
        const y = (e.clientY - r.top)  / r.height;  // 0 → 1
        const tiltY = (x - .5) *  10;               // -5° → +5° (rotation Y, axe vertical)
        const tiltX = (y - .5) * -8;                // +4° → -4° (rotation X, axe horizontal)
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.setProperty('--tilt-x', `${tiltX}deg`);
          card.style.setProperty('--tilt-y', `${tiltY}deg`);
        });
      });
      card.addEventListener('mouseleave', reset);
    });
  }

  function init() {
    _initTilt();
    // Attendre que les produits soient chargés
    Store.on('productsLoaded', () => {
      const cardNew = document.getElementById('heroCardNew');
      const cardFav = document.getElementById('heroCardFav');

      const newProds = _getByTag('Nouveau');
      const favProds = _getByTag('Bestseller');
      const all = Store.getProducts().filter(p => p.stock > 0);

      // Fallback si tags vides : toujours afficher quelque chose
      const pNew = newProds.length ? newProds : (all.length ? all.slice(0, 3) : []);
      // Si pas de bestsellers : décale d'1 produit, sinon revient au premier
      let pFav;
      if (favProds.length) {
        pFav = favProds;
      } else if (all.length > 1) {
        pFav = all.slice(1).concat(all.slice(0, 1));
      } else {
        pFav = all;
      }

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
