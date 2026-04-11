// New user direct channel with Midnight
document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('messages');
  const input = document.getElementById('input');
  const form = document.getElementById('composer');
  const sendButton = form?.querySelector('.send');
  const MIDNIGHT_AVATAR = 'assets/images/member-Midnight.jpeg';
  const USER_AVATAR = 'assets/images/newuser.png';
  const adminIntentPattern = /\b(admin|administrator|administration|adminship|admin\s+access|admin\s+role)\b/i;

  if (!messagesEl || !input || !form) return;

  createChatApp({
    messagesEl,
    input,
    form,
    sendButton,
    centerTimestamps: true,
    centerTimestampGapMs: 10 * 60 * 1000,
    hideMessageMeta: true,
    ownAvatarSrc: USER_AVATAR,
    memberAvatarOverrides: {
      Midnight: MIDNIGHT_AVATAR
    },
    onSendMessage: (text, helpers) => {
      if (!helpers || !adminIntentPattern.test(text)) return;

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

    const avatar = document.createElement('img');
    avatar.className = 'msg-avatar';
    avatar.src = MIDNIGHT_AVATAR;
    avatar.alt = 'Midnight avatar';

    const bubble = document.createElement('div');
    bubble.className = 'bubble typing-bubble';

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';

    bubble.appendChild(dots);
    article.appendChild(avatar);
    article.appendChild(bubble);
    messagesEl.appendChild(article);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    window.setTimeout(() => {
      article.remove();
    }, 3000);
  }
});
