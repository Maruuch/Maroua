// ================================================================
// 💳 CHECKOUT — formulaire + soumission commande
// ================================================================

const Checkout = (() => {

  function init() {
    document.getElementById('backCheckout').addEventListener('click', () => {
      Store.navigate('home');
      Drawer.open();
    });

    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!_validate(e.target)) return;
      await _submit(e.target);
    });
  }

  function render() {
    const summaryEl = document.getElementById('checkoutSummary');
    Components.checkoutSummary(summaryEl);
    // Reset form
    document.getElementById('checkoutForm').reset();
    document.querySelectorAll('.form-group input.error').forEach(el => el.classList.remove('error'));
  }

  function _validate(form) {
    let valid = true;
    const required = ['nom', 'telephone', 'ville', 'adresse'];
    required.forEach(name => {
      const el = form.elements[name];
      if (!el || !el.value.trim()) {
        el && el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });
    if (!valid) Toast.error('Veuillez remplir les champs obligatoires');
    return valid;
  }

  async function _submit(form) {
    if (!Cart.canCheckout()) return;

    const btn      = document.getElementById('submitOrder');
    const btnText  = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    // UI loading
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    btnLoader.style.animation = 'spin 1s linear infinite';

    const data = Object.fromEntries(new FormData(form));

    const payload = {
      nom:          data.nom.trim(),
      telephone:    data.telephone.trim(),
      email:        data.email?.trim() || '',
      adresse:      data.adresse.trim(),
      ville:        data.ville.trim(),
      code_postal:  data.code_postal?.trim() || '',
      note:         data.note?.trim() || '',
      articles:     Cart.toPayload(),
    };

    try {
      const res = await API.submitOrder(payload);
      Store.cartClear();
      const ref = res?.ref_public || res?.order_ref || 'MAR-XXXXXX';
      document.getElementById('successRef').textContent = `Référence : ${ref}`;
      Store.navigate('success');
    } catch (err) {
      Toast.error(err.message || 'Erreur lors de la commande. Réessayez.');
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  }

  return { init, render };
})();

// ================================================================
// 🛒 CHECKOUT DRAWER — formulaire latéral sans changer de page
// ================================================================

const CheckoutDrawer = (() => {
  let _open = false;

  function open() {
    _renderSummary();
    document.getElementById('checkoutDrawerForm').reset();
    document.querySelectorAll('#checkoutDrawer .form-group input.error')
      .forEach(el => el.classList.remove('error'));
    document.getElementById('checkoutDrawer').classList.add('open');
    document.getElementById('cdrOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    _open = true;
  }

  function close() {
    document.getElementById('checkoutDrawer').classList.remove('open');
    document.getElementById('cdrOverlay').classList.remove('open');
    document.body.style.overflow = '';
    _open = false;
  }

  function _renderSummary() {
    const items    = Store.cartItems();
    const shipping = CONFIG.SHIPPING_FEE;
    const total    = Store.cartTotal();
    const el       = document.getElementById('cdrSummary');

    el.innerHTML = items.map(i => `
      <div class="cdr-row">
        <span>${i.product.name} <em style="opacity:.55;font-style:normal">×${i.qty}</em></span>
        <span>${(i.product.price * i.qty).toLocaleString()} MAD</span>
      </div>`).join('')
    + `<div class="cdr-row" style="font-size:.76rem;color:var(--text3)">
        <span>Livraison</span><span>${shipping} MAD</span>
       </div>
       <div class="cdr-row cdr-total">
        <span>Total</span>
        <span>${total.toLocaleString()} MAD</span>
       </div>`;
  }

  function _validate(form) {
    let valid = true;
    ['nom', 'telephone', 'ville', 'adresse'].forEach(name => {
      const el = form.elements[name];
      if (!el || !el.value.trim()) {
        el && el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });
    if (!valid) Toast.error('Veuillez remplir les champs obligatoires');
    return valid;
  }

  async function _submit() {
    const form = document.getElementById('checkoutDrawerForm');
    if (!_validate(form) || !Cart.canCheckout()) return;

    const btn     = document.getElementById('cdrSubmit');
    const btnText = btn.querySelector('.btn-text');
    const btnLdr  = btn.querySelector('.btn-loader');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLdr.style.display  = 'inline';
    btnLdr.style.animation = 'spin 1s linear infinite';

    const data = Object.fromEntries(new FormData(form));
    const payload = {
      nom:         data.nom.trim(),
      telephone:   data.telephone.trim(),
      email:       data.email?.trim()        || '',
      adresse:     data.adresse.trim(),
      ville:       data.ville.trim(),
      code_postal: data.code_postal?.trim()  || '',
      note:        data.note?.trim()         || '',
      articles:    Cart.toPayload(),
    };

    try {
      const res = await API.submitOrder(payload);
      Store.cartClear();
      const ref = res?.ref_public || res?.order_ref || 'MAR-XXXXXX';
      document.getElementById('successRef').textContent = `Référence : ${ref}`;
      close();
      Store.navigate('success');
    } catch (err) {
      Toast.error(err.message || 'Erreur lors de la commande. Réessayez.');
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLdr.style.display  = 'none';
    }
  }

  function init() {
    document.getElementById('cdrClose').addEventListener('click', close);
    document.getElementById('cdrOverlay').addEventListener('click', close);
    document.getElementById('cdrBack').addEventListener('click', () => {
      close();
      Drawer.open();
    });
    document.getElementById('cdrSubmit').addEventListener('click', _submit);
  }

  return { init, open, close };
})();
