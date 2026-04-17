// ================================================================
// 🧩 COMPONENTS — cartes produit, résumé commande, etc.
// ================================================================

const Components = (() => {

  // ── Product Card ────────────────────────────────────────────
  function productCard(p, delay = 0) {
    const inStock = p.stock > 0;
    const stockLow = p.stock > 0 && p.stock <= 3;
    const imgSrc = (p.images && p.images.length > 0) ? p.images[0] : `/images/${p.id}.webp`;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${delay}ms`;
    card.dataset.id = p.id;

    card.innerHTML = `
      <div class="card-image">
        <img src="${imgSrc}" alt="${p.name}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="card-placeholder" style="display:none">${p.sym || '◈'}</div>
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

    // Clic carte → page produit
    card.addEventListener('click', e => {
      if (e.target.closest('.card-add')) return;
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

    return card;
  }

  // ── Product Detail ──────────────────────────────────────────
  function productDetail(p) {
    const inStock = p.stock > 0;
    const stockLow = inStock && p.stock <= 3;
    const imgSrc = (p.images && p.images.length > 0) ? p.images[0] : `/images/${p.id}.webp`;

    let qty = 1;

    const allImages = (p.images && p.images.length > 0) ? p.images : [imgSrc];
    const hasMultiple = allImages.length > 1;

    const el = document.createElement('div');
    el.className = 'product-detail';
    el.innerHTML = `
      <div class="detail-gallery">
        <div class="detail-main-img">
          <img src="${imgSrc}" alt="${p.name}" id="detailMainImg"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="card-placeholder" style="display:none;aspect-ratio:3/4">${p.sym || '◈'}</div>
          ${hasMultiple ? `
          <button class="gallery-arrow gallery-prev" aria-label="Précédent">&#8592;</button>
          <button class="gallery-arrow gallery-next" aria-label="Suivant">&#8594;</button>
          <div class="gallery-dots">${allImages.map((_,i) => `<span class="gallery-dot${i===0?' active':''}"></span>`).join('')}</div>
          ` : ''}
        </div>
      </div>
      <div class="detail-info">
        <div class="detail-type">${p.type || ''}</div>
        <h1 class="detail-name">${p.name}</h1>
        <div class="detail-sym">${p.sym || ''}</div>
        <p class="detail-desc-short">${p.description_courte || ''}</p>
        <div class="detail-price">${p.price} <span>MAD</span></div>
        <div class="detail-etat">${p.etat || ''}</div>
        ${stockLow ? `<p class="detail-stock-msg low">Plus que ${p.stock} en stock</p>` : ''}
        ${!inStock ? `<p class="detail-stock-msg out">Rupture de stock</p>` : ''}
        ${inStock ? `
        <div class="detail-qty">
          <button class="qty-btn" id="qtyMinus">−</button>
          <span class="qty-val" id="qtyVal">1</span>
          <button class="qty-btn" id="qtyPlus">+</button>
        </div>` : ''}
        <div class="detail-actions">
          <button class="btn-primary" id="detailAddBtn" ${!inStock ? 'disabled style="opacity:.5"' : ''}>
            <span>${inStock ? 'Ajouter au panier' : 'Indisponible'}</span>
          </button>
        </div>
        ${p.description_longue ? `<p class="detail-desc-full">${p.description_longue}</p>` : ''}
      </div>`;

    if (inStock) {
      const valEl   = el.querySelector('#qtyVal');
      const minusEl = el.querySelector('#qtyMinus');
      const plusEl  = el.querySelector('#qtyPlus');
      const addEl   = el.querySelector('#detailAddBtn');

      // Carousel flèches
      if (hasMultiple) {
        let currentIdx = 0;
        const mainImg = el.querySelector('#detailMainImg');
        const dots = el.querySelectorAll('.gallery-dot');

        const goTo = (idx) => {
          currentIdx = (idx + allImages.length) % allImages.length;
          mainImg.src = allImages[currentIdx];
          mainImg.style.display = '';
          dots.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
        };

        el.querySelector('.gallery-prev').addEventListener('click', () => goTo(currentIdx - 1));
        el.querySelector('.gallery-next').addEventListener('click', () => goTo(currentIdx + 1));
      }

      minusEl.addEventListener('click', () => { if (qty > 1) valEl.textContent = --qty; });
      plusEl.addEventListener('click', () => { if (qty < p.stock) valEl.textContent = ++qty; });

      addEl.addEventListener('click', () => {
        Store.cartAdd(p.id, qty);
        Toast.success(`${p.name} ajouté au panier`);
        Drawer.open();
      });
    }

    return el;
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

  return { productCard, productDetail, cartItem, checkoutSummary };
})();
