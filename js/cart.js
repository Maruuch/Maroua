// ================================================================
// 🛍️ CART — helpers (logique dans Store, UI dans Drawer)
// ================================================================

const Cart = (() => {
  // Validation avant checkout
  function canCheckout() {
    const items = Store.cartItems();
    if (!items.length) {
      Toast.info('Votre panier est vide');
      return false;
    }
    // Vérifier le stock actuel
    for (const item of items) {
      if (item.product.stock < item.qty) {
        Toast.error(`Stock insuffisant pour "${item.product.name}"`);
        return false;
      }
    }
    return true;
  }

  // Formater les articles pour le payload n8n
  function toPayload() {
    return Store.cartItems().map(i => ({
      id:  i.product.id,
      qty: i.qty,
    }));
  }

  return { canCheckout, toPayload };
})();
