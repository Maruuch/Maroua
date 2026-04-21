// ================================================================
// 💛 FAVORITES — gestion locale + hooks pour sync compte client
// ----------------------------------------------------------------
//   Stockage local (localStorage) — clé mj_favorites
//   API :
//     Favorites.list()         → [ids]
//     Favorites.has(id)
//     Favorites.add(id)
//     Favorites.remove(id)
//     Favorites.toggle(id)     → bool (nouvel état)
//     Favorites.count()
//     Favorites.clear()
//     Favorites.on('change', cb)
//   Sync future (compte client) : Favorites._syncHook peut être
//   branché par account.js pour pousser les favoris côté serveur.
// ================================================================

const Favorites = (() => {
  const KEY = 'mj_favorites';
  let _ids = _load();
  const _listeners = [];

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(Number.isFinite) : [];
    } catch { return []; }
  }
  function _save() {
    try { localStorage.setItem(KEY, JSON.stringify(_ids)); } catch {}
    _emit();
    // Hook de sync optionnel (ex. account.js)
    if (typeof Favorites._syncHook === 'function') {
      try { Favorites._syncHook(_ids); } catch (e) { console.warn('Favorites sync:', e); }
    }
  }
  function _emit() {
    _listeners.forEach(cb => { try { cb(_ids); } catch {} });
  }

  function list()      { return _ids.slice(); }
  function has(id)     { return _ids.includes(Number(id)); }
  function count()     { return _ids.length; }
  function clear()     { _ids = []; _save(); }

  function add(id) {
    id = Number(id);
    if (!has(id)) { _ids.push(id); _save(); }
    return true;
  }
  function remove(id) {
    id = Number(id);
    const i = _ids.indexOf(id);
    if (i >= 0) { _ids.splice(i, 1); _save(); }
    return false;
  }
  function toggle(id) {
    return has(id) ? remove(id) : add(id);
  }
  function on(event, cb) {
    if (event === 'change' && typeof cb === 'function') _listeners.push(cb);
  }

  return { list, has, add, remove, toggle, count, clear, on, _syncHook: null };
})();
