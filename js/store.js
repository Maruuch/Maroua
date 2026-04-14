// ================================================================
// 🗄️  STORE — état global de l'application
// ================================================================

const Store = (() => {
  const CART_KEY = 'mj_cart';

  let _state = {
    page: 'home',          // home | catalog | product | checkout | success
    filter: '',            // type filter actif
    currentProductId: null,
    products: [],
    cart: _loadCart(),
  };

  // ── Listeners ─────────────────────────────────────────────
  const _listeners = {};

  function on(event, cb) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(cb);
  }
  function emit(event, data) {
    (_listeners[event] || []).forEach(cb => cb(data));
  }

  // ── Cart persistence ───────────────────────────────────────
  function _loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }
  function _saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(_state.cart)); }
    catch {}
    emit('cart', _state.cart);
  }

  // ── Products ───────────────────────────────────────────────
  function setProducts(list) {
    _state.products = list;
    emit('products', list);
  }
  function getProducts() { return _state.products; }
  function getProduct(id) { return _state.products.find(p => p.id === id); }

  // ── Navigation ─────────────────────────────────────────────
  function navigate(page, extra = {}) {
    _state.page = page;
    if (extra.filter !== undefined) _state.filter = extra.filter;
    if (extra.productId !== undefined) _state.currentProductId = extra.productId;
    emit('navigate', { page, ..._state });
  }

  // ── Cart operations ────────────────────────────────────────
  function cartAdd(productId, qty = 1) {
    const p = getProduct(productId);
    if (!p) return;
    const existing = _state.cart.find(i => i.id === productId);
    const maxQty = p.stock || 0;
    if (maxQty <= 0) return;

    if (existing) {
      const newQty = Math.min(existing.qty + qty, maxQty);
      if (newQty === existing.qty) return 'max';
      existing.qty = newQty;
    } else {
      _state.cart.push({ id: productId, qty: Math.min(qty, maxQty) });
    }
    _saveCart();
    return 'added';
  }

  function cartRemove(productId) {
    _state.cart = _state.cart.filter(i => i.id !== productId);
    _saveCart();
  }

  function cartSetQty(productId, qty) {
    const item = _state.cart.find(i => i.id === productId);
    const p = getProduct(productId);
    if (!item || !p) return;
    if (qty <= 0) { cartRemove(productId); return; }
    item.qty = Math.min(qty, p.stock || 99);
    _saveCart();
  }

  function cartClear() { _state.cart = []; _saveCart(); }

  function cartItems() {
    return _state.cart.map(i => {
      const p = getProduct(i.id);
      return { ...i, product: p };
    }).filter(i => i.product);
  }

  function cartCount() { return _state.cart.reduce((s, i) => s + i.qty, 0); }

  function cartSubtotal() {
    return cartItems().reduce((s, i) => s + i.product.price * i.qty, 0);
  }

  function cartTotal() {
    return cartSubtotal() + (cartItems().length ? CONFIG.SHIPPING_FEE : 0);
  }

  function getState() { return { ..._state }; }

  return {
    on, emit,
    setProducts, getProducts, getProduct,
    navigate, getState,
    cartAdd, cartRemove, cartSetQty, cartClear,
    cartItems, cartCount, cartSubtotal, cartTotal,
  };
})();
