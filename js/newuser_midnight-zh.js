// New user direct channel with Midnight (zh)
document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('messages');
  const input = document.getElementById('input');
  const form = document.getElementById('composer');
  const sendButton = form?.querySelector('.send');

  if (!messagesEl || !input || !form || !sendButton) return;

  const MIDNIGHT_AVATAR = 'assets/images/member-Midnight.jpeg';
  const USER_AVATAR = 'assets/images/newuser.png';
  const API_ENDPOINT = '/api/psychologist-chat';
  const adminIntentPattern = /\b(admin|administrator|administration|adminship|admin\s+access|admin\s+role)\b/i;

  let isAwaitingReply = false;
  let hasSentAdminReply = false;
  const history = [];

  const chatApp = createChatApp({
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
    onSendMessage: async (text) => {
      history.push({ role: 'user', content: text });

      if (!hasSentAdminReply && adminIntentPattern.test(text)) {
        hasSentAdminReply = true;
        handleAdminIntentReply();
        return;
      }

      await handleApiReply(text);
    }
  });

  function appendAssistantMessage(text) {
    const entry = {
      user: 'Midnight',
      text,
      me: false,
      time: nowHHMM()
    };
    chatApp.appendMessage(entry);
    history.push({ role: 'assistant', content: text });
  }

  function handleAdminIntentReply() {
    const lines = [
      '你有兴趣申请管理员职位？',
      '如果你愿意，我们可以从一些小任务开始。不需要急着担任完整的职责。',
      '我已经给你开放了权限。',
      '当你在登录页面将登录窗口移到一边，你就会发现隐藏的入口。'
    ];

    window.setTimeout(() => {
      appendTypingIndicator();
    }, 3400);

    lines.forEach((line, index) => {
      const delay = index < 2 ? 1200 + index * 1200 : 6400 + (index - 2) * 1400;
      window.setTimeout(() => {
        appendAssistantMessage(line);
      }, delay);
    });
  }

  async function handleApiReply(text) {
    if (isAwaitingReply) return;
    isAwaitingReply = true;
    const typingToken = appendTypingIndicator();

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: history.slice(0, -1)
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Request failed.');
      }

      const reply = String(data?.reply || '').trim();
      if (!reply) {
        history.pop();
        return;
      }

      appendAssistantMessage(reply);
    } catch (_error) {
      history.pop();
      appendAssistantMessage('……出了点问题。稍后再试一次吧。');
    } finally {
      removeTypingIndicator(typingToken);
      isAwaitingReply = false;
    }
  }

  function appendTypingIndicator() {
    const token = { id: `midnight-${Date.now()}` };
    const article = document.createElement('article');
    article.className = 'msg';
    article.dataset.typingToken = token.id;

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
    return token;
  }

  function removeTypingIndicator(token) {
    if (!token?.id) return;
    messagesEl.querySelector(`[data-typing-token="${token.id}"]`)?.remove();
  }

  function nowHHMM() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
});
