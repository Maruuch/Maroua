// ================================================================
// 🕑 RECENTLY VIEWED — historique des dernières fiches produit vues
// ----------------------------------------------------------------
//   Stockage local, limite configurable (défaut 8).
//   API :
//     RecentlyViewed.push(id)         → enregistre une vue
//     RecentlyViewed.list()           → [ids] triés du + récent au + ancien
//     RecentlyViewed.products(excludeId, limit)  → [product] enrichi via Store
//     RecentlyViewed.clear()
// ================================================================

const RecentlyViewed = (() => {
  const KEY   = 'mj_recently_viewed';
  const LIMIT = 12; // stocke jusqu'à 12 max, on affiche moins

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(Number.isFinite) : [];
    } catch { return []; }
  }
  function _save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  }

  function push(id) {
    id = Number(id);
    if (!Number.isFinite(id)) return;
    let list = _load().filter(x => x !== id);
    list.unshift(id);
    if (list.length > LIMIT) list = list.slice(0, LIMIT);
    _save(list);
  }

  function list() { return _load(); }

  function products(excludeId = null, limit = 6) {
    if (typeof Store === 'undefined' || !Store.getProducts) return [];
    const ids = _load();
    const exclude = excludeId != null ? Number(excludeId) : null;
    return ids
      .filter(id => id !== exclude)
      .map(id => Store.getProduct(id))
      .filter(p => p && p.actif !== false)
      .slice(0, limit);
  }

  function clear() { _save([]); }

  return { push, list, products, clear };
})();
