// New user direct channel with Midnight and Psychologist
document.addEventListener('DOMContentLoaded', () => {
  const messagesEl = document.getElementById('messages');
  const input = document.getElementById('input');
  const form = document.getElementById('composer');
  const sendButton = form?.querySelector('.send');
  const titleEl = document.getElementById('channelTitle');
  const subtitleEl = document.getElementById('channelSubtitle');
  const headerAvatar = document.querySelector('.chat-header-avatar');
  const switchButtons = Array.from(document.querySelectorAll('[data-channel]'));

  if (!messagesEl || !input || !form || !sendButton || !titleEl || !subtitleEl || !headerAvatar) return;

  const MIDNIGHT_AVATAR = 'assets/images/member-Midnight.jpeg';
  const USER_AVATAR = 'assets/images/newuser.png';
  const adminIntentPattern = /\b(admin|administrator|administration|adminship|admin\s+access|admin\s+role)\b/i;

  const channelConfig = {
    midnight: {
      label: 'Midnight',
      subtitle: 'Encrypted direct line for sensitive updates',
      avatar: MIDNIGHT_AVATAR,
      inputPlaceholder: 'Message Midnight - Press Enter to send, Shift+Enter for new line'
    },
    psychologist: {
      label: '心理医生',
      subtitle: 'Private counseling line',
      avatar: MIDNIGHT_AVATAR,
      inputPlaceholder: 'Message 心理医生 - Press Enter to send, Shift+Enter for new line',
      endpoint: '/api/psychologist-chat'
    }
  };

  const conversations = {
    midnight: {
      history: [],
      messages: [],
      locked: false,
      placeholder: channelConfig.midnight.inputPlaceholder,
      sequenceStarted: false
    },
    psychologist: {
      history: [],
      messages: [],
      locked: false,
      placeholder: channelConfig.psychologist.inputPlaceholder
    }
  };

  let activeChannel = 'midnight';

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
      Midnight: MIDNIGHT_AVATAR,
      心理医生: MIDNIGHT_AVATAR
    },
    onSendMessage: (text) => {
      const state = conversations[activeChannel];
      const currentConfig = channelConfig[activeChannel];
      state.messages.push({
        user: 'You',
        text,
        me: true,
        time: nowHHMM()
      });

      if (activeChannel === 'midnight') {
        handleMidnightMessage(text);
        return;
      }

      state.history.push({ role: 'user', content: text });
      handleApiCharacterMessage(activeChannel, currentConfig.endpoint);
    }
  });

  switchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const channel = button.getAttribute('data-channel');
      if (!channel || !channelConfig[channel] || channel === activeChannel) return;
      activeChannel = channel;
      renderActiveChannel();
    });
  });

  renderActiveChannel();

  function renderActiveChannel() {
    const config = channelConfig[activeChannel];
    const state = conversations[activeChannel];

    titleEl.textContent = config.label;
    subtitleEl.textContent = config.subtitle;
    headerAvatar.src = config.avatar;
    headerAvatar.alt = config.label;
    input.placeholder = state.placeholder || config.inputPlaceholder;
    input.disabled = state.locked;
    sendButton.disabled = state.locked;

    switchButtons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-channel') === activeChannel);
    });

    messagesEl.innerHTML = '';
    state.messages.forEach((entry) => {
      chatApp.appendMessage({
        user: entry.user,
        text: entry.text,
        time: entry.time,
        me: Boolean(entry.me)
      });
    });
  }

  function appendAssistantMessage(channel, text) {
    const config = channelConfig[channel];
    const state = conversations[channel];
    const entry = {
      user: config.label,
      text,
      me: false,
      time: nowHHMM()
    };
    state.messages.push(entry);
    state.history.push({ role: 'assistant', content: text });

    if (activeChannel === channel) {
      chatApp.appendMessage(entry);
    }
  }

  function setChannelLock(channel, locked, placeholder) {
    const state = conversations[channel];
    state.locked = locked;
    if (placeholder) {
      state.placeholder = placeholder;
    }

    if (activeChannel === channel) {
      input.disabled = locked;
      sendButton.disabled = locked;
      input.value = '';
      input.placeholder = state.placeholder || channelConfig[channel].inputPlaceholder;
    }
  }

  function handleMidnightMessage(text) {
    const state = conversations.midnight;
    if (state.sequenceStarted || !adminIntentPattern.test(text)) return;
    state.sequenceStarted = true;

    window.setTimeout(() => {
      if (activeChannel === 'midnight') {
        appendTypingIndicator('midnight');
      }
    }, 3400);

    const lines = [
      'You’re interested in applying as an administrator?',
      'If you’d like, we can start with a few small tasks. There’s no need to rush into the full role.',
      'I’ve already granted you access.',
      'Once you move the login window aside on the login page, you’ll discover the hidden entrance.'
    ];

    lines.forEach((line, index) => {
      const delay = index < 2 ? 1200 + index * 1200 : 6400 + (index - 2) * 1400;
      window.setTimeout(() => {
        appendAssistantMessage('midnight', line);
      }, delay);
    });
  }

  async function handleApiCharacterMessage(channel, endpoint) {
    const state = conversations[channel];
    const typingToken = appendTypingIndicator(channel);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: state.history[state.history.length - 1]?.content || '',
          history: state.history.slice(0, -1)
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Request failed.');
      }

      const reply = String(data?.reply || '').trim();
      if (!reply) return;
      appendAssistantMessage(channel, reply);
    } catch (error) {
      appendAssistantMessage(channel, '...Something went wrong. Try again in a moment.');
    } finally {
      removeTypingIndicator(channel, typingToken);
    }
  }

  function appendTypingIndicator(channel) {
    const token = { id: `${channel}-${Date.now()}` };
    if (activeChannel !== channel) return token;

    const config = channelConfig[channel];
    const article = document.createElement('article');
    article.className = 'msg';
    article.dataset.typingToken = token.id;

    const avatar = document.createElement('img');
    avatar.className = 'msg-avatar';
    avatar.src = config.avatar;
    avatar.alt = `${config.label} avatar`;

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

  function removeTypingIndicator(channel, token) {
    if (activeChannel !== channel || !token?.id) return;
    messagesEl.querySelector(`[data-typing-token="${token.id}"]`)?.remove();
  }

  function nowHHMM() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
});
