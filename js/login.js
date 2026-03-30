document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMsg = document.getElementById('errorMsg');
  const loginCard = document.getElementById('loginCard');
  const dragHandle = document.getElementById('loginDragHandle');
  const pageDim = document.getElementById('pageDim');
  const adminEntry = document.getElementById('adminEntry');

  const VALID_USERNAME = 'NewUser_x7a93';
  const VALID_PASSWORD = 'x7a93';
  const MONITORED_USERNAME = 'allerylin';
  const MONITORED_PASSWORD = '20090414';
  const NEW_USER_REGISTERED_KEY = 'bwNewUserRegisteredDate';
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let isDragging = false;
  let adminUnlocked = false;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username.toLowerCase() === MONITORED_USERNAME.toLowerCase() && password === MONITORED_PASSWORD) {
      errorMsg.textContent = '';
      window.location.href = 'surveillance_warning.html';
      return;
    }

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      errorMsg.textContent = '';
      sessionStorage.setItem('bwUsername', username);
      localStorage.setItem(NEW_USER_REGISTERED_KEY, formatLoginDate(new Date()));
      window.location.href = 'chat_newuser.html';
    } else {
      errorMsg.textContent = 'Incorrect username or password.';
      alert('Incorrect username or password.');
      passwordInput.value = '';
      passwordInput.focus();
    }
  });

  dragHandle?.addEventListener('pointerdown', (event) => {
    if (!loginCard) return;

    const rect = loginCard.getBoundingClientRect();
    loginCard.classList.add('is-draggable');
    loginCard.style.left = `${rect.left}px`;
    loginCard.style.top = `${rect.top}px`;
    loginCard.style.width = `${rect.width}px`;

    dragOffsetX = event.clientX - rect.left;
    dragOffsetY = event.clientY - rect.top;
    isDragging = true;

    dragHandle.setPointerCapture?.(event.pointerId);
    updateDragState();
  });

  document.addEventListener('pointermove', (event) => {
    if (!isDragging || !loginCard) return;

    loginCard.style.left = `${event.clientX - dragOffsetX}px`;
    loginCard.style.top = `${event.clientY - dragOffsetY}px`;
    updateDragState();
  });

  document.addEventListener('pointerup', () => {
    isDragging = false;
    updateDragState();
  });

  adminEntry?.addEventListener('click', () => {
    window.location.href = 'Administratorchat.html';
  });

  function updateDragState() {
    if (!loginCard) return;

    const rect = loginCard.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    const visibleArea = visibleWidth * visibleHeight;
    const totalArea = Math.max(1, rect.width * rect.height);
    const visibleRatio = visibleArea / totalArea;
    const darkness = Math.min(0.92, Math.max(0, 1 - visibleRatio));

    if (pageDim) {
      pageDim.style.opacity = String(darkness);
    }

    const isMostlyOutside = visibleRatio <= 0.35;
    if (isMostlyOutside && !adminUnlocked) {
      adminUnlocked = true;
      loginCard.classList.add('is-fading-out');
      window.setTimeout(() => {
        loginCard.hidden = true;
        if (adminEntry) adminEntry.hidden = false;
      }, 320);
    } else if (adminEntry && !adminUnlocked) {
      adminEntry.hidden = true;
    }
  }

  function formatLoginDate(date) {
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
  }
});
