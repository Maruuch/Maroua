// ================================================================
// 🌐 API — appels vers n8n
// ================================================================

const API = (() => {

  async function submitOrder(payload) {
    const url = CONFIG.N8N_WEBHOOK_URL;
    if (!url) throw new Error('N8N_WEBHOOK_URL non configuré dans config.js');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errMsg = `Erreur serveur (${res.status})`;
      try { const body = await res.json(); errMsg = body.message || errMsg; } catch {}
      throw new Error(errMsg);
    }

    return res.json();
  }

  return { submitOrder };
})();
