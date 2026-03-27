(function(){
  function nowHHMM(){
    const d = new Date();
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }

  function escapeHTML(s){
    return s.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  /**
   * Shared chat UI wiring
   * @param {Object} options
   */
  window.createChatApp = function createChatApp(options){
    const {
      messagesEl,
      input,
      form,
      quickSearch,
      memberList,
      memberModal,
      modalMessageButton,
      sendButton,
      showTime = true,
      ownMessageTimePlacement = 'inline',
      onSendMessage,
      onMemberMessage
    } = options;

    if (!messagesEl || !input || !form) return null;

    const modalName = memberModal?.querySelector('#modalName');
    const modalStatusLabel = memberModal?.querySelector('#modalStatusLabel');
    const modalStatusDot = memberModal?.querySelector('#modalStatusDot');
    const modalAvatar = memberModal?.querySelector('#modalAvatar');
    const modalRegistered = memberModal?.querySelector('#modalRegistered');
    const modalRole = memberModal?.querySelector('#modalRole');
    const modalCloseBtn = memberModal?.querySelector('.modal-close');

    let lastMemberTrigger = null;
    let composerLocked = false;

    const autoGrow = () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 160) + 'px';
    };
    ['input','change'].forEach(evt => input.addEventListener(evt, autoGrow));
    autoGrow();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (composerLocked) return;
      const text = input.value.trim();
      if (!text) return;
      const time = nowHHMM();

      if (ownMessageTimePlacement === 'center') {
        appendCenteredTime(time);
      }

      appendMessage({
        user: 'You',
        time,
        text,
        me: true,
        showTime: ownMessageTimePlacement === 'inline'
      });

      input.value = '';
      autoGrow();

      onSendMessage?.(text, { appendMessage, lockComposer });
    });

    quickSearch?.addEventListener('input', () => {
      const q = quickSearch.value.trim().toLowerCase();
      messagesEl.querySelectorAll('.msg .bubble p').forEach(p => {
        const show = p.innerText.toLowerCase().includes(q);
        p.closest('.msg').style.display = show ? '' : 'none';
      });
    });

    const statusMap = {
      online: { label: 'Online', className: 'online' },
      idle: { label: 'Idle', className: 'idle' },
      offline: { label: 'Offline', className: 'offline' }
    };

    memberList?.addEventListener('click', (event) => {
      const item = event.target.closest('li');
      if (!item) return;
      openMemberDetails(item);
    });

    memberList?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Space' && event.key !== 'Spacebar') return;
      const item = event.target.closest('li');
      if (!item) return;
      event.preventDefault();
      openMemberDetails(item);
    });

    memberModal?.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && memberModal && !memberModal.hidden) {
        closeModal();
      }
    });

    modalMessageButton?.addEventListener('click', () => {
      const targetMember = modalMessageButton.dataset.member || '';
      if (!targetMember || !onMemberMessage) return;
      onMemberMessage(targetMember);
    });

    function appendMessage({ user, time, text, me=false, variant='', showTime: showTimeOverride }) {
      const article = document.createElement('article');
      const classNames = ['msg'];
      if (me) classNames.push('me');
      if (variant) classNames.push(variant);
      article.className = classNames.join(' ');

      const bubble = document.createElement('div');
      bubble.className = 'bubble';

      const header = document.createElement('header');
      header.className = 'meta';
      const shouldShowTime = typeof showTimeOverride === 'boolean' ? showTimeOverride : showTime;
      header.innerHTML = shouldShowTime
        ? `<span class="user">${escapeHTML(user)}</span><span class="time">${time}</span>`
        : `<span class="user">${escapeHTML(user)}</span>`;

      const p = document.createElement('p');
      p.innerText = text;

      bubble.appendChild(header);
      bubble.appendChild(p);

      article.appendChild(bubble);

      messagesEl.appendChild(article);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function appendCenteredTime(time){
      const stamp = document.createElement('div');
      stamp.className = 'date-stamp';
      stamp.innerText = time;
      messagesEl.appendChild(stamp);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function openMemberDetails(item){
      if (!memberModal || !modalName || !modalStatusLabel || !modalStatusDot) return;

      const statusKey = item.dataset.status || 'offline';
      const status = statusMap[statusKey] || statusMap.offline;

      modalName.textContent = item.dataset.member || '';
      modalStatusLabel.textContent = status.label;
      modalStatusDot.className = `status ${status.className}`;
      if (modalAvatar) {
        const avatarSrc = item.dataset.avatar || 'assets/images/avatar.png';
        modalAvatar.src = avatarSrc;
        modalAvatar.alt = `${modalName.textContent} avatar`;
      }
      if (modalRole) {
        const roleText = item.dataset.role || '';
        modalRole.textContent = roleText ? `Role: ${roleText}` : '';
      }
      if (modalRegistered) {
        modalRegistered.textContent = item.dataset.registered ? `Registered Time: ${item.dataset.registered}` : '';
      }
      if (modalMessageButton) {
        modalMessageButton.dataset.member = item.dataset.member || '';
      }

      memberModal.hidden = false;
      modalCloseBtn?.focus();
      lastMemberTrigger = item;
    }

    function closeModal(){
      if (!memberModal) return;
      memberModal.hidden = true;
      modalCloseBtn?.blur();
      if (modalRole) {
        modalRole.textContent = '';
      }
      if (modalRegistered) {
        modalRegistered.textContent = '';
      }
      if (modalMessageButton) {
        delete modalMessageButton.dataset.member;
      }
      if (lastMemberTrigger) {
        lastMemberTrigger.focus();
        lastMemberTrigger = null;
      }
    }

    function lockComposer(placeholder='Access revoked.'){
      if (composerLocked) return;
      composerLocked = true;
      if (input) {
        input.value = '';
        input.disabled = true;
        input.placeholder = placeholder;
        input.setAttribute('aria-disabled', 'true');
      }
      if (sendButton) {
        sendButton.disabled = true;
        sendButton.setAttribute('aria-disabled', 'true');
      }
    }

    return { appendMessage, lockComposer };
  };
})();
