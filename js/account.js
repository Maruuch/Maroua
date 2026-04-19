// ================================================================
// 👤 ACCOUNT — gestion complète compte client
//   - Vues : login / register / forgot / dashboard (orders + profile)
//   - Session localStorage, refresh auto profil + commandes
//   - Endpoints n8n configurables via window.ACCOUNT_CONFIG
//   - OAuth Google / Apple : hooks prévus, redirige vers n8n si configuré
// ================================================================

const AccountDrawer = (() => {

  // ── Configuration (override via window.ACCOUNT_CONFIG avant init) ──
  const CFG = Object.assign({
    // URLs des webhooks n8n (HTTPS obligatoire)
    endpoints: {
      login:       '/api/account/login',
      register:    '/api/account/register',
      forgot:      '/api/account/forgot',
      profile:     '/api/account/profile',
      profileUpdate:'/api/account/profile/update',
      orders:      '/api/account/orders',
      oauthGoogle: '/api/account/oauth/google',
      oauthApple:  '/api/account/oauth/apple',
    },
    storageKey: 'maroua_session',
  }, window.ACCOUNT_CONFIG || {});

  // ── État interne ──
  let currentUser = null;
  let currentToken = null;
  let currentOrders = [];

  // ── Utilitaires ──
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  function showError(el, msg, isSuccess = false) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.classList.toggle('is-success', !!isSuccess);
  }
  function hideError(el) { if (el) el.hidden = true; }

  function saveSession(data) {
    const payload = {
      token: data.token,
      user:  data.user,
      savedAt: Date.now(),
    };
    localStorage.setItem(CFG.storageKey, JSON.stringify(payload));
    currentToken = data.token;
    currentUser  = data.user;
  }
  function loadSession() {
    try {
      const raw = localStorage.getItem(CFG.storageKey);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.token || !s.user) return null;
      currentToken = s.token;
      currentUser  = s.user;
      return s;
    } catch { return null; }
  }
  function clearSession() {
    localStorage.removeItem(CFG.storageKey);
    currentToken = null;
    currentUser  = null;
    currentOrders = [];
  }

  // ── API wrapper ──
  async function apiCall(endpoint, method, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    const res = await fetch(endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const msg = data.error || data.message || `Erreur ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ── Vues ──
  function showView(name) {
    $$('.acc-view').forEach(v => v.hidden = true);
    const target = $(`#accView-${name}`);
    if (target) target.hidden = false;
    const title = $('#accountTitle');
    if (title) {
      const map = {
        login:'Connexion', register:'Créer un compte',
        forgot:'Mot de passe oublié', dashboard:'Mon espace',
      };
      title.textContent = map[name] || 'Mon espace';
    }
  }

  function routeByAuth() {
    if (currentUser) { showView('dashboard'); renderDashboard(); }
    else { showView('login'); }
  }

  // ── Dashboard ──
  function renderDashboard() {
    const u = currentUser;
    if (!u) return;
    const avatar = $('#accAvatar');
    if (avatar) avatar.textContent = (u.name || u.email || 'M').trim().charAt(0).toUpperCase();
    const name = $('#accUsername');
    if (name) name.textContent = u.name || u.email || 'Client';

    // Remplir profil form
    const f = $('#accFormProfile');
    if (f) {
      ['name','email','phone','city','address'].forEach(k => {
        const el = f.querySelector(`[name="${k}"]`);
        if (el) el.value = u[k] || '';
      });
    }
    // Charger les commandes
    fetchOrders();
  }

  async function fetchOrders() {
    const list = $('#accOrdersList');
    if (!list) return;
    list.innerHTML = '<div class="acc-loading">Chargement de vos commandes…</div>';
    try {
      const data = await apiCall(CFG.endpoints.orders, 'GET');
      currentOrders = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
      renderOrders();
    } catch (e) {
      list.innerHTML = `<div class="acc-empty"><div class="acc-empty-sym">✦</div><p>Impossible de charger vos commandes pour le moment.</p></div>`;
    }
  }

  function renderOrders() {
    const list = $('#accOrdersList');
    if (!list) return;
    if (!currentOrders.length) {
      list.innerHTML = `
        <div class="acc-empty">
          <div class="acc-empty-sym">✦</div>
          <p>Aucune commande pour le moment.</p>
          <button type="button" class="btn-primary" id="accShopBtnEmpty"><span>Voir la collection</span></button>
        </div>`;
      const b = $('#accShopBtnEmpty');
      if (b) b.addEventListener('click', () => { close(); Store.navigate('catalog', { filter: '' }); });
      return;
    }
    list.innerHTML = currentOrders.map(o => {
      const status = (o.status || 'pending').toLowerCase();
      const statusLabel = ({
        delivered: 'Livrée', pending: 'En attente', shipped: 'Expédiée',
        cancelled: 'Annulée', processing: 'En préparation'
      })[status] || o.status || 'En attente';
      const statusClass = status === 'delivered' ? 'is-delivered'
                        : status === 'cancelled' ? 'is-cancelled'
                        : 'is-pending';
      const total = typeof o.total === 'number' ? `${o.total.toLocaleString()} MAD` : (o.total || '');
      const date = o.date ? new Date(o.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '';
      return `
        <div class="acc-order-card" data-order-id="${o.id || ''}">
          <div class="acc-order-head">
            <span class="acc-order-ref">${o.ref || o.id || '—'}</span>
            <span class="acc-order-status ${statusClass}">${statusLabel}</span>
          </div>
          <div class="acc-order-foot">
            <span>${date}</span>
            <span class="acc-order-total">${total}</span>
          </div>
        </div>`;
    }).join('');
  }

  // ── Handlers formulaires ──
  async function handleLogin(e) {
    e.preventDefault();
    const f = e.target;
    const errEl = $('#accLoginError');
    hideError(errEl);
    const email = f.email.value.trim();
    const password = f.password.value;
    try {
      const data = await apiCall(CFG.endpoints.login, 'POST', { email, password });
      if (!data.token || !data.user) throw new Error('Réponse invalide du serveur');
      saveSession(data);
      showView('dashboard');
      renderDashboard();
    } catch (err) {
      showError(errEl, err.message || 'Email ou mot de passe incorrect');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const f = e.target;
    const errEl = $('#accRegisterError');
    hideError(errEl);
    const payload = {
      name:     f.name.value.trim(),
      email:    f.email.value.trim(),
      phone:    f.phone.value.trim(),
      password: f.password.value,
    };
    try {
      const data = await apiCall(CFG.endpoints.register, 'POST', payload);
      if (!data.token || !data.user) throw new Error('Réponse invalide du serveur');
      saveSession(data);
      showView('dashboard');
      renderDashboard();
    } catch (err) {
      showError(errEl, err.message || 'Impossible de créer le compte');
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    const f = e.target;
    const msgEl = $('#accForgotMsg');
    hideError(msgEl);
    try {
      await apiCall(CFG.endpoints.forgot, 'POST', { email: f.email.value.trim() });
      showError(msgEl, 'Si ce compte existe, un email vient d\'être envoyé.', true);
      f.reset();
    } catch (err) {
      // Même message pour ne pas révéler si l'email existe
      showError(msgEl, 'Si ce compte existe, un email vient d\'être envoyé.', true);
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    const f = e.target;
    const msgEl = $('#accProfileMsg');
    hideError(msgEl);
    const payload = {
      name:    f.name.value.trim(),
      phone:   f.phone.value.trim(),
      city:    f.city.value.trim(),
      address: f.address.value.trim(),
    };
    try {
      const data = await apiCall(CFG.endpoints.profileUpdate, 'POST', payload);
      if (data.user) {
        currentUser = Object.assign({}, currentUser, data.user);
        saveSession({ token: currentToken, user: currentUser });
      } else {
        currentUser = Object.assign({}, currentUser, payload);
        saveSession({ token: currentToken, user: currentUser });
      }
      renderDashboard();
      showError(msgEl, 'Informations enregistrées', true);
    } catch (err) {
      showError(msgEl, err.message || 'Impossible d\'enregistrer');
    }
  }

  // ── OAuth ──
  function handleOAuth(provider) {
    const url = provider === 'google' ? CFG.endpoints.oauthGoogle : CFG.endpoints.oauthApple;
    if (!url || url.startsWith('/api/')) {
      // Pas encore configuré : feedback utilisateur
      const errEl = $('#accLoginError') || $('#accRegisterError');
      showError(errEl, `Connexion ${provider === 'google' ? 'Google' : 'Apple'} bientôt disponible`);
      return;
    }
    // Redirection OAuth (n8n gère le flow complet)
    const returnTo = encodeURIComponent(window.location.href);
    window.location.href = `${url}?return_to=${returnTo}`;
  }

  // ── Post-OAuth callback (si URL contient ?token=...&user=...) ──
  function consumeOAuthCallback() {
    const p = new URLSearchParams(window.location.search);
    const token = p.get('mj_token');
    const userJson = p.get('mj_user');
    if (token && userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));
        saveSession({ token, user });
        // Nettoyer l'URL
        p.delete('mj_token'); p.delete('mj_user');
        const clean = window.location.pathname + (p.toString() ? '?' + p.toString() : '');
        history.replaceState({}, '', clean);
        open();
        showView('dashboard');
        renderDashboard();
      } catch {}
    }
  }

  // ── Logout ──
  function logout() {
    clearSession();
    showView('login');
  }

  // ── Drawer open/close ──
  function open() {
    $('#accountDrawer').classList.add('open');
    $('#accountOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    routeByAuth();
  }
  function close() {
    $('#accountDrawer').classList.remove('open');
    $('#accountOverlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Tabs ──
  function activateTab(name) {
    $$('.acc-nav-btn').forEach(b => b.classList.toggle('is-active', b.dataset.accTab === name));
    $$('.acc-tab').forEach(t => t.hidden = (t.id !== `accTab-${name}`));
  }

  // ── Init ──
  function init() {
    loadSession();
    consumeOAuthCallback();

    // Open / close
    const btn = $('#accountBtn');
    if (btn) btn.addEventListener('click', open);
    const closeBtn = $('#accountClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    const ov = $('#accountOverlay');
    if (ov) ov.addEventListener('click', close);

    // Formulaires
    const fLogin = $('#accFormLogin');       if (fLogin) fLogin.addEventListener('submit', handleLogin);
    const fRegister = $('#accFormRegister'); if (fRegister) fRegister.addEventListener('submit', handleRegister);
    const fForgot = $('#accFormForgot');     if (fForgot) fForgot.addEventListener('submit', handleForgot);
    const fProfile = $('#accFormProfile');   if (fProfile) fProfile.addEventListener('submit', handleProfileSave);

    // Navigation entre vues (data-acc-go)
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-acc-go]');
      if (!t) return;
      const name = t.dataset.accGo;
      if (name) showView(name);
    });

    // OAuth
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-oauth]');
      if (!t) return;
      handleOAuth(t.dataset.oauth);
    });

    // Tabs dashboard
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-acc-tab]');
      if (!t) return;
      activateTab(t.dataset.accTab);
    });

    // Logout
    const lo = $('#accLogout');
    if (lo) lo.addEventListener('click', logout);
  }

  return {
    init, open, close,
    isLoggedIn: () => !!currentUser,
    getUser:    () => currentUser,
    logout,
  };
})();
