// New user direct channel with Midnight
document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('messages');
  const input = document.getElementById('input');
  const form = document.getElementById('composer');
  const sendButton = form?.querySelector('.send');

  if (!messagesEl || !input || !form) return;

  createChatApp({
    messagesEl,
    input,
    form,
    sendButton,
    onSendMessage: (text, helpers) => {
      const normalized = text.toLowerCase();
      if (!helpers || !normalized.includes('administrator')) return;

      const lines = [
        'You’re interested in applying as an administrator?',
        'If you’d like, we can start with a few small tasks. There’s no need to rush into the full role.',
        'I’ve already granted you access.',
        'Once you move the login window aside on the login page, you’ll discover the hidden entrance.'
      ];

      lines.forEach((line, index) => {
        const delay = index < 2 ? 1200 + index * 1200 : 6400 + (index - 2) * 1400;
        window.setTimeout(() => {
          helpers.appendMessage({
            user: 'Midnight',
            time: nowHHMM(),
            text: line
          });
        }, delay);
      });

      window.setTimeout(() => {
        appendTypingIndicator();
      }, 3400);
    }
  });

  function nowHHMM(){
    const d = new Date();
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }

  function appendTypingIndicator(){
    const article = document.createElement('article');
    article.className = 'msg';

    const bubble = document.createElement('div');
    bubble.className = 'bubble typing-bubble';

    const header = document.createElement('header');
    header.className = 'meta';
    header.innerHTML = `<span class="user">Midnight</span><span class="time">${nowHHMM()}</span>`;

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';

    bubble.appendChild(header);
    bubble.appendChild(dots);
    article.appendChild(bubble);
    messagesEl.appendChild(article);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    window.setTimeout(() => {
      article.remove();
    }, 3000);
  }
});
