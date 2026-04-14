// ================================================================
// 🛒 DRAWER — panier latéral
// ================================================================

const Drawer = (() => {
  let _isOpen = false;

  function open() {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    _isOpen = true;
    _render();
  }

  function close() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
    document.body.style.overflow = '';
    _isOpen = false;
  }

  function toggle() { _isOpen ? close() : open(); }

  function _render() {
    if (!_isOpen) return;
    const items = Store.cartItems();
    const itemsEl  = document.getElementById('drawerItems');
    const footerEl = document.getElementById('drawerFooter');

    if (items.length === 0) {
      itemsEl.innerHTML = '<div class="drawer-empty">Votre panier est vide</div>';
      footerEl.innerHTML = '';
      return;
    }

    itemsEl.innerHTML = '';
    items.forEach(item => itemsEl.appendChild(Components.cartItem(item)));

    const subtotal = Store.cartSubtotal();
    const shipping = CONFIG.SHIPPING_FEE;
    const total    = Store.cartTotal();

    footerEl.innerHTML = `
      <div class="drawer-total-row">
        <span>Sous-total</span><span>${subtotal.toLocaleString()} MAD</span>
      </div>
      <div class="drawer-total-row">
        <span>Livraison</span><span>${shipping} MAD</span>
      </div>
      <div class="drawer-total-row" style="margin-top:.5rem;padding-top:.5rem;border-top:1px solid var(--border)">
        <span style="font-family:var(--serif);font-size:1.1rem">Total</span>
        <span style="color:var(--gold);font-family:var(--serif);font-size:1.2rem">${total.toLocaleString()} MAD</span>
      </div>
      <p class="drawer-shipping">Livraison partout au Maroc · 48h</p>
      <button class="btn-primary drawer-checkout" id="drawerCheckoutBtn">
        <span>Passer la commande</span>
      </button>`;

    document.getElementById('drawerCheckoutBtn').addEventListener('click', () => {
      close();
      Store.navigate('checkout');
    });
  }

  function init() {
    document.getElementById('drawerClose').addEventListener('click', close);
    document.getElementById('cartOverlay').addEventListener('click', close);
    document.getElementById('cartBtn').addEventListener('click', toggle);
    Store.on('cart', () => {
      _updateCount();
      if (_isOpen) _render();
    });
  }

  function _updateCount() {
    const n = Store.cartCount();
    const el = document.getElementById('cartCount');
    el.textContent = n;
    el.classList.toggle('visible', n > 0);
  }

  return { init, open, close, toggle };
})();
