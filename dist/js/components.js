// ================================================================
// 🧩 COMPONENTS — cartes produit, fiche produit premium, etc.
// ================================================================

const Components = (() => {

  // ── SVG Heart (state-less) ──────────────────────────────────
  const heartSVG = (filled = false) => `
    <svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}"
         stroke="currentColor" stroke-width="1.4"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`;

  // ── Product Card ────────────────────────────────────────────
  function productCard(p, delay = 0) {
    const inStock = p.stock > 0;
    const stockLow = p.stock > 0 && p.stock <= 3;
    const imgSrc = (p.images && p.images.length > 0) ? p.images[0] : `/images/${p.id}.webp`;
    const isFav  = Favorites && Favorites.has(p.id);

    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${delay}ms`;
    card.dataset.id = p.id;

    card.innerHTML = `
      <div class="card-image">
        <img src="${imgSrc}" alt="${p.name}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="card-placeholder" style="display:none">${p.sym || '◈'}</div>
        <button class="card-fav ${isFav ? 'is-fav' : ''}" data-id="${p.id}" aria-label="Favoris" type="button">
          ${heartSVG(isFav)}
        </button>
        ${p.tag ? `<span class="card-badge">${p.tag}</span>` : ''}
        ${!inStock ? '<div class="card-out">Rupture de stock</div>' : ''}
        <div class="card-overlay">
          <button class="card-add" data-id="${p.id}" ${!inStock ? 'disabled' : ''}>
            ${inStock ? 'Ajouter au panier' : 'Indisponible'}
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-type">${p.type || ''}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-footer">
          <span class="card-price">${p.price} MAD</span>
          ${stockLow ? `<span class="card-stock-low">Plus que ${p.stock}</span>` : ''}
        </div>
      </div>`;

    // Carousel lazy : init au premier survol de la carte
    const cardImgEl  = card.querySelector('.card-image img');
    const cardImgDiv = card.querySelector('.card-image');
    const allCardImgs = (p.images && p.images.length > 0) ? p.images : [`/images/${p.id}.webp`];
    let carouselReady = false;
    let curIdx = 0;

    cardImgDiv.addEventListener('mouseenter', () => {
      if (carouselReady) return;
      carouselReady = true;
      Promise.all(allCardImgs.map(src => new Promise(res => {
        const t = new Image();
        t.onload  = () => res(src);
        t.onerror = () => res(null);
        t.src = src;
      }))).then(results => {
        const valid = results.filter(Boolean);
        if (valid.length <= 1) return;

        const pz = document.createElement('div');
        pz.className = 'gallery-zone gallery-zone-prev card-gallery-zone';
        const nz = document.createElement('div');
        nz.className = 'gallery-zone gallery-zone-next card-gallery-zone';
        cardImgDiv.appendChild(pz);
        cardImgDiv.appendChild(nz);

        const goTo = i => {
          curIdx = (i + valid.length) % valid.length;
          cardImgEl.src = valid[curIdx];
        };
        pz.addEventListener('click', e => { e.stopPropagation(); goTo(curIdx - 1); });
        nz.addEventListener('click', e => { e.stopPropagation(); goTo(curIdx + 1); });
      });
    });

    // Clic carte → page produit
    card.addEventListener('click', e => {
      if (e.target.closest('.card-add') || e.target.closest('.card-fav')) return;
      Store.navigate('product', { productId: p.id });
    });

    // Clic "Ajouter"
    const addBtn = card.querySelector('.card-add');
    if (addBtn && inStock) {
      addBtn.addEventListener('click', e => {
        e.stopPropagation();
        const result = Store.cartAdd(p.id, 1);
        if (result === 'added') {
          Toast.success(`${p.name} ajouté au panier`);
          Drawer.open();
        } else if (result === 'max') {
          Toast.info('Quantité maximale atteinte');
        }
      });
    }

    // Clic "Favoris"
    const favBtn = card.querySelector('.card-fav');
    if (favBtn) {
      favBtn.addEventListener('click', e => {
        e.stopPropagation();
        const nowFav = Favorites.toggle(p.id);
        favBtn.classList.toggle('is-fav', nowFav);
        favBtn.classList.add('pulsing');
        favBtn.innerHTML = heartSVG(nowFav);
        setTimeout(() => favBtn.classList.remove('pulsing'), 450);
        Toast.info(nowFav ? 'Ajouté aux favoris' : 'Retiré des favoris');
      });
    }

    return card;
  }

  // ── Product Detail (premium card layout) ────────────────────
  function productDetail(p) {
    const inStock  = p.stock > 0;
    const stockLow = inStock && p.stock <= 3;
    const imgSrc   = (p.images && p.images.length > 0) ? p.images[0] : `/images/${p.id}.webp`;
    const allImages = (p.images && p.images.length > 0) ? p.images : [imgSrc];
    const isFav    = Favorites && Favorites.has(p.id);

    let qty = 1;

    const el = document.createElement('div');
    el.className = 'product-detail';

    // ── Caractéristiques : tous les champs supportés, ignore ceux vides ──
    const specFields = [
      { key: 'style',                 label: 'Style' },
      { key: 'sexe',                  label: 'Sexe' },
      { key: 'modele',                label: 'Modèle' },
      { key: 'occasion',              label: 'Occasion' },
      { key: 'materiau',              label: 'Matériau principal' },
      { key: 'materiau_pendentif',    label: 'Matériau pendentif' },
      { key: 'materiau_chaine',       label: 'Matériau chaîne' },
      { key: 'materiau_incrustation', label: 'Matériau incrustation' },
      { key: 'classification',        label: 'Classification' },
      { key: 'poids',                 label: 'Poids' },
      { key: 'quantite',              label: 'Quantité par lot' },
      { key: 'etat',                  label: 'État' }
    ];
    // Helper : normalise string ou array en "Valeur · Valeur · Valeur"
    const formatSpecValue = (v) => {
      if (v === null || v === undefined || v === '') return '';
      let parts;
      if (Array.isArray(v))                       parts = v;
      else if (typeof v === 'string' && v.includes(','))
                                                  parts = v.split(',');
      else                                        parts = [String(v)];
      parts = parts.map(s => String(s).trim()).filter(Boolean);
      return parts.join('<span class="spec-sep">·</span>');
    };

    const specsHTML = specFields
      .map(f => {
        const formatted = formatSpecValue(p[f.key]);
        if (!formatted) return '';
        return `
          <div class="spec-row">
            <span class="spec-label">${f.label}</span>
            <span class="spec-value">${formatted}</span>
          </div>`;
      })
      .filter(Boolean)
      .join('');

    el.innerHTML = `
      <!-- ── GALERIE ─────────────────────────────────────────── -->
      <div class="detail-gallery reveal">
        <div class="detail-main-img">
          <img src="${imgSrc}" alt="${p.name}" id="detailMainImg"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="card-placeholder" style="display:none;aspect-ratio:3/4">${p.sym || '◈'}</div>
          ${p.tag ? `<span class="detail-badge">${p.tag}</span>` : ''}
          <button class="detail-fav ${isFav ? 'is-fav' : ''}" id="detailFavBtn" aria-label="Favoris" type="button">
            ${heartSVG(isFav)}
          </button>
        </div>
      </div>

      <!-- ── INFO CARD ───────────────────────────────────────── -->
      <div class="detail-card reveal">

        <!-- HEAD -->
        <div class="detail-card-head">
          <div class="detail-type">${p.type || ''}</div>
          <h1 class="detail-name">${p.name}</h1>
          <div class="detail-sym">${p.sym || ''}</div>
          ${p.description_courte ? `<p class="detail-desc-short">${p.description_courte}</p>` : ''}
        </div>

        <!-- PRIX -->
        <div class="detail-price-block">
          <div class="detail-price">${p.price} <span>MAD</span></div>
          ${p.etat ? `<div class="detail-etat-chip">${p.etat}</div>` : ''}
        </div>

        ${stockLow ? `<p class="detail-stock-msg low">Plus que ${p.stock} en stock</p>` : ''}
        ${!inStock ? `<p class="detail-stock-msg out">Rupture de stock</p>` : ''}

        <!-- ACTIONS -->
        ${inStock ? `
        <div class="detail-actions-row">
          <div class="detail-qty">
            <button class="qty-btn" id="qtyMinus" aria-label="Diminuer">−</button>
            <span class="qty-val" id="qtyVal">1</span>
            <button class="qty-btn" id="qtyPlus" aria-label="Augmenter">+</button>
          </div>
          <button class="btn-primary detail-add" id="detailAddBtn">
            <span>Ajouter au panier</span>
          </button>
        </div>
        ` : `
        <div class="detail-actions-row">
          <button class="btn-primary detail-add" disabled style="opacity:.5">
            <span>Indisponible</span>
          </button>
        </div>`}

        <!-- PROMISES STRIP -->
        <div class="detail-promises">
          <span>✦ Livraison 48h</span>
          <span>✦ Paiement à la livraison</span>
          <span>✦ Emballage cadeau</span>
        </div>

        <!-- DESCRIPTION LONGUE -->
        ${p.description_longue ? `
        <div class="detail-section">
          <h3 class="detail-section-title">Description</h3>
          <p class="detail-desc-full">${p.description_longue}</p>
        </div>` : ''}

        <!-- CARACTÉRISTIQUES -->
        ${specsHTML ? `
        <div class="detail-section">
          <h3 class="detail-section-title">Caractéristiques</h3>
          <div class="spec-grid">
            ${specsHTML}
          </div>
        </div>` : ''}

      </div>`;

    // ── Carousel zones + dots ──
    const mainImgEl  = el.querySelector('#detailMainImg');
    const mainImgDiv = el.querySelector('.detail-main-img');
    Promise.all(allImages.map(src => new Promise(res => {
      const t = new Image();
      t.onload  = () => res(src);
      t.onerror = () => res(null);
      t.src = src;
    }))).then(results => {
      const validImgs = results.filter(Boolean);
      if (validImgs.length <= 1) return;

      let idx = 0;

      const dotsEl = document.createElement('div');
      dotsEl.className = 'gallery-dots';
      dotsEl.innerHTML = validImgs.map((_, i) =>
        `<span class="gallery-dot${i===0?' active':''}"></span>`).join('');

      const prevZone = document.createElement('div');
      prevZone.className = 'gallery-zone gallery-zone-prev';
      const nextZone = document.createElement('div');
      nextZone.className = 'gallery-zone gallery-zone-next';

      mainImgDiv.appendChild(prevZone);
      mainImgDiv.appendChild(nextZone);
      mainImgDiv.appendChild(dotsEl);

      const dots = dotsEl.querySelectorAll('.gallery-dot');
      const goTo = (i) => {
        idx = (i + validImgs.length) % validImgs.length;
        mainImgEl.classList.add('img-fading');
        setTimeout(() => {
          mainImgEl.src = validImgs[idx];
          mainImgEl.style.display = '';
          mainImgEl.classList.remove('img-fading');
        }, 140);
        dots.forEach((d, j) => d.classList.toggle('active', j === idx));
      };

      dots.forEach((d, j) => d.addEventListener('click', () => goTo(j)));
      prevZone.addEventListener('click', () => goTo(idx - 1));
      nextZone.addEventListener('click', () => goTo(idx + 1));
    });

    // ── Qty + Ajouter ──
    if (inStock) {
      const valEl   = el.querySelector('#qtyVal');
      const minusEl = el.querySelector('#qtyMinus');
      const plusEl  = el.querySelector('#qtyPlus');
      const addEl   = el.querySelector('#detailAddBtn');

      const bump = node => {
        node.classList.remove('bump');
        // force reflow
        void node.offsetWidth;
        node.classList.add('bump');
      };

      minusEl.addEventListener('click', () => {
        if (qty > 1) { valEl.textContent = --qty; bump(valEl); }
      });
      plusEl.addEventListener('click', () => {
        if (qty < p.stock) { valEl.textContent = ++qty; bump(valEl); }
      });

      addEl.addEventListener('click', () => {
        Store.cartAdd(p.id, qty);
        Toast.success(`${p.name} ajouté au panier`);
        Drawer.open();
        addEl.classList.add('btn-flash');
        setTimeout(() => addEl.classList.remove('btn-flash'), 600);
      });
    }

    // ── Favoris (détail) ──
    const favBtn = el.querySelector('#detailFavBtn');
    if (favBtn) {
      favBtn.addEventListener('click', e => {
        e.stopPropagation();
        const nowFav = Favorites.toggle(p.id);
        favBtn.classList.toggle('is-fav', nowFav);
        favBtn.classList.add('pulsing');
        favBtn.innerHTML = heartSVG(nowFav);
        setTimeout(() => favBtn.classList.remove('pulsing'), 450);
        Toast.info(nowFav ? 'Ajouté aux favoris' : 'Retiré des favoris');
      });
    }

    return el;
  }

  // ── Recently Viewed Section ─────────────────────────────────
  function recentlyViewedSection(products) {
    if (!products || !products.length) return null;

    const wrap = document.createElement('section');
    wrap.className = 'recent-section reveal';
    wrap.innerHTML = `
      <div class="recent-head">
        <span class="section-label">Votre historique</span>
        <h2 class="section-title">Derniers produits consultés</h2>
      </div>
      <div class="recent-grid"></div>`;

    const grid = wrap.querySelector('.recent-grid');
    products.forEach((p, i) => grid.appendChild(productCard(p, i * 70)));
    return wrap;
  }

  // ── Cart Item ───────────────────────────────────────────────
  function cartItem(item) {
    const { id, qty, product: p } = item;
    const imgSrc = (p.images && p.images.length > 0) ? p.images[0] : `/images/${id}.webp`;

    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-img">
        <img src="${imgSrc}" alt="${p.name}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="sym">${p.sym || '◈'}</div>
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-price">${(p.price * qty).toLocaleString()} MAD</div>
        <div class="cart-item-qty">
          <button data-action="dec" data-id="${id}">−</button>
          <span>${qty}</span>
          <button data-action="inc" data-id="${id}">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${id}">Retirer</button>`;

    el.querySelector('[data-action="dec"]').addEventListener('click', () => Store.cartSetQty(id, qty - 1));
    el.querySelector('[data-action="inc"]').addEventListener('click', () => Store.cartSetQty(id, qty + 1));
    el.querySelector('.cart-item-remove').addEventListener('click', () => Store.cartRemove(id));

    return el;
  }

  // ── Checkout Summary ────────────────────────────────────────
  function checkoutSummary(container) {
    const items = Store.cartItems();
    const subtotal = Store.cartSubtotal();
    const shipping = CONFIG.SHIPPING_FEE;
    const total = Store.cartTotal();

    container.innerHTML = `
      <h3 class="summary-title">Récapitulatif</h3>
      <div class="summary-items">
        ${items.map(i => `
          <div class="summary-item">
            <div>
              <div class="summary-item-name">${i.product.name}</div>
              <div class="summary-item-qty">× ${i.qty}</div>
            </div>
            <span class="summary-item-price">${(i.product.price * i.qty).toLocaleString()} MAD</span>
          </div>`).join('')}
      </div>
      <div class="summary-totals">
        <div class="summary-row">
          <span>Sous-total</span>
          <span>${subtotal.toLocaleString()} MAD</span>
        </div>
        <div class="summary-row">
          <span>Livraison</span>
          <span>${shipping} MAD</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>${total.toLocaleString()} MAD</span>
        </div>
      </div>`;
  }

  return { productCard, productDetail, recentlyViewedSection, cartItem, checkoutSummary };
})();
