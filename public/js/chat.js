// ================================================================
// 💬 CHAT — fenêtre d'assistance flottante
// ================================================================

const Chat = (() => {

  let open = false;

  const REPLIES = {
    'Je veux voir la collection': {
      msg: 'Avec plaisir ! Découvrez toute notre collection de bijoux.',
      action: () => {
        close();
        Store.navigate('catalog', { filter: '' });
      }
    },
    'Infos sur la livraison': {
      msg: 'Nous livrons partout au Maroc en 24–72h selon votre ville. Les frais sont de 35 MAD forfaitaires.',
      action: null
    },
    'Contact WhatsApp': {
      msg: 'Vous pouvez nous joindre directement sur WhatsApp :',
      action: () => {
        window.open('https://wa.me/212600000000', '_blank');
      }
    }
  };

  function _addBubble(text, type = 'bot') {
    const body = document.getElementById('chatBody');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    bubble.innerHTML = text;
    body.appendChild(bubble);
    body.scrollTop = body.scrollHeight;
  }

  function _handleMessage(msg) {
    _addBubble(msg, 'user');
    // Simuler la réponse
    setTimeout(() => {
      const reply = REPLIES[msg];
      if (reply) {
        _addBubble(reply.msg, 'bot');
        if (reply.action) setTimeout(reply.action, 600);
      } else {
        _addBubble(
          'Merci pour votre message ! Notre équipe vous répondra très prochainement sur WhatsApp 📱',
          'bot'
        );
      }
    }, 480);
  }

  function openChat() {
    document.getElementById('chatWindow').classList.add('open');
    open = true;
  }

  function close() {
    document.getElementById('chatWindow').classList.remove('open');
    open = false;
  }

  function toggle() {
    open ? close() : openChat();
  }

  function init() {
    document.getElementById('chatFab').addEventListener('click', toggle);
    document.getElementById('chatClose').addEventListener('click', close);

    // Quick replies
    document.querySelectorAll('.chat-qr').forEach(btn => {
      btn.addEventListener('click', () => {
        _handleMessage(btn.dataset.msg);
      });
    });

    // Input + send
    const input  = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSend');

    function send() {
      const msg = input.value.trim();
      if (!msg) return;
      input.value = '';
      _handleMessage(msg);
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') send();
    });
  }

  return { init, open: openChat, close };
})();
