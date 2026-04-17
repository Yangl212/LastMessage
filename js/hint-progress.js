document.addEventListener('DOMContentLoaded', () => {
  const config = window.HintProgressConfig;
  if (!config) return;

  const body = document.body;
  const root = document.createElement('div');
  const storageKey = typeof config.storageKey === 'string' && config.storageKey.trim()
    ? config.storageKey.trim()
    : '';
  const theme = config.theme === 'dark' ? 'dark' : 'light';
  const autoCloseMs = Number(config.autoCloseMs ?? 5000);
  const title = config.title || 'Hint';
  const buttonLabel = typeof config.buttonLabel === 'string' && config.buttonLabel.trim()
    ? config.buttonLabel.trim()
    : title;
  const footerLabelOnly = config.footerLabelOnly === true;
  const valueLabel = typeof config.valueLabel === 'string' && config.valueLabel.trim()
    ? config.valueLabel.trim()
    : '';
  const showProgressFill = config.showProgressFill !== false;
  const actionButtonLabel = typeof config.actionButtonLabel === 'string' && config.actionButtonLabel.trim()
    ? config.actionButtonLabel.trim()
    : '';
  const actionButtonHref = typeof config.actionButtonHref === 'string' && config.actionButtonHref.trim()
    ? config.actionButtonHref.trim()
    : '';
  const fontFamily = typeof config.fontFamily === 'string' && config.fontFamily.trim()
    ? config.fontFamily.trim()
    : '';
  const lines = Array.isArray(config.lines) && config.lines.length
    ? config.lines
    : ['Hint content pending.'];
  const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  let currentPercent = clampPercent(config.percent ?? 5);
  const formatPercent = (value) => `${clampPercent(value)}%`;
  const readStoredPercent = () => {
    if (!storageKey) return null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return null;
      return clampPercent(raw);
    } catch (_error) {
      return null;
    }
  };
  const persistPercent = () => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, String(currentPercent));
    } catch (_error) {
      // Ignore storage failures and keep the in-memory value.
    }
  };
  const buildFrames = (targetPercent) => {
    const target = clampPercent(targetPercent);
    if (Array.isArray(config.frames) && config.frames.length) {
      return config.frames.map((frame) => typeof frame === 'number' ? `${frame}%` : String(frame));
    }
    if (target <= 2) return ['1%', formatPercent(target)];
    const approach = Math.max(1, target - 2);
    return ['1%', `${Math.max(2, Math.floor(target / 2))}%`, `${approach}%`, formatPercent(target)];
  };
  const storedPercent = readStoredPercent();
  if (storedPercent !== null) currentPercent = storedPercent;
  const displayPercent = valueLabel || formatPercent(currentPercent);

  root.className = 'hint-progress-root';
  root.dataset.theme = theme;
  root.style.setProperty('--hp-progress-target', displayPercent);
  if (fontFamily) {
    root.style.setProperty('--hp-ui-font', fontFamily);
    root.style.setProperty('--hp-body-font', `"${fontFamily}"`);
  }
  root.innerHTML = `
    <button type="button" class="progress-toggle" aria-expanded="false" aria-controls="progressFooter" aria-label="${title}">
      <img src="assets/images/hint.png" alt="" class="progress-toggle-icon" aria-hidden="true" />
    </button>

    <footer class="app-footer progress-footer${footerLabelOnly ? ' progress-footer-compact' : ''}" id="progressFooter">
      ${footerLabelOnly ? `
        <div class="progress-meter progress-meter-label-only" aria-label="${buttonLabel}">
          <button type="button" class="progress-hint-button">${buttonLabel}</button>
        </div>
      ` : `
        <div class="progress-meter" aria-label="Progress ${displayPercent}">
          <span class="progress-value">${displayPercent}</span>
          <div class="progress-shell">
            <div class="progress-track">
              <div class="progress-fill${showProgressFill ? '' : ' is-empty'}"></div>
            </div>
          </div>
          <button type="button" class="progress-hint-button">${buttonLabel}</button>
        </div>
      `}
    </footer>

    <div class="hint-modal-overlay" hidden>
      <div class="hint-modal" role="dialog" aria-modal="true" aria-labelledby="hintModalTitle">
        <div class="hint-titlebar">
          <h2 id="hintModalTitle">${title}</h2>
          <button type="button" class="hint-close" aria-label="Close ${title}">
            <img src="assets/images/exit.png" alt="" class="hint-close-icon" />
          </button>
        </div>
        <div class="hint-modal-inner">
          <div class="hint-modal-page">
            ${lines.map((line) => `<p class="hint-modal-line">${line}</p>`).join('')}
          </div>
          <div class="hint-scrollbar" aria-hidden="true">
            <button type="button" class="hint-scroll-arrow">⌃</button>
            <div class="hint-scroll-track">
              <span class="hint-scroll-thumb"></span>
            </div>
            <button type="button" class="hint-scroll-arrow">⌄</button>
          </div>
        </div>
        ${actionButtonLabel ? `
          <div class="hint-modal-actions">
            <button type="button" class="hint-action-button">${actionButtonLabel}</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  body.appendChild(root);
  root.classList.remove('is-open');

  const toggle = root.querySelector('.progress-toggle');
  const progressFill = root.querySelector('.progress-fill');
  const progressValue = root.querySelector('.progress-value');
  const hintButton = root.querySelector('.progress-hint-button');
  const hintModal = root.querySelector('.hint-modal-overlay');
  const hintModalClose = root.querySelector('.hint-close');
  const hintModalPage = root.querySelector('.hint-modal-page');
  const hintActionButton = root.querySelector('.hint-action-button');

  let progressTextTimer = null;
  let progressAutoCloseTimer = null;
  let hintPulseTimer = null;
  let currentLines = [...lines];

  function renderHintLines(nextLines) {
    if (!hintModalPage) return;
    hintModalPage.innerHTML = nextLines
      .map((line) => `<p class="hint-modal-line">${line}</p>`)
      .join('');
  }

  function setFillWidth(value, animated = true) {
    if (!progressFill) return;
    progressFill.style.transition = animated ? 'width 1.2s ease-out' : 'none';
    progressFill.style.width = formatPercent(value);
  }

  function syncDisplayedPercent() {
    const formatted = formatPercent(currentPercent);
    if (progressValue) progressValue.textContent = valueLabel || formatted;
    root.style.setProperty('--hp-progress-target', showProgressFill ? formatted : '0%');
  }

  function replayProgressAnimation() {
    if (!progressFill) return;
    progressFill.style.transition = 'none';
    progressFill.style.width = '0%';
    void progressFill.offsetWidth;
    setFillWidth(currentPercent, true);
  }

  function replayProgressValue() {
    if (!progressValue) return;
    const frames = buildFrames(currentPercent);
    let index = 0;

    if (progressTextTimer) {
      window.clearInterval(progressTextTimer);
      progressTextTimer = null;
    }

    progressValue.textContent = valueLabel || frames[0];
    progressTextTimer = window.setInterval(() => {
      index += 1;
      progressValue.textContent = valueLabel || frames[Math.min(index, frames.length - 1)];

      if (index >= frames.length - 1) {
        window.clearInterval(progressTextTimer);
        progressTextTimer = null;
        progressValue.textContent = valueLabel || formatPercent(currentPercent);
      }
    }, 80);
  }

  function closeProgressFooter() {
    root.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (progressAutoCloseTimer) {
      window.clearTimeout(progressAutoCloseTimer);
      progressAutoCloseTimer = null;
    }
  }

  function scheduleProgressAutoClose() {
    if (progressAutoCloseTimer) {
      window.clearTimeout(progressAutoCloseTimer);
    }
    progressAutoCloseTimer = window.setTimeout(closeProgressFooter, autoCloseMs);
  }

  function closeHintModal() {
    if (!hintModal) return;
    hintModal.hidden = true;
  }

  function setLines(nextLines) {
    if (!Array.isArray(nextLines) || !nextLines.length) return;
    currentLines = nextLines.map((line) => String(line));
    renderHintLines(currentLines);
  }

  function pulseToggle() {
    if (!toggle) return;
    toggle.classList.remove('is-pulsing');
    void toggle.offsetWidth;
    toggle.classList.add('is-pulsing');
    if (hintPulseTimer) {
      window.clearTimeout(hintPulseTimer);
    }
    hintPulseTimer = window.setTimeout(() => {
      toggle.classList.remove('is-pulsing');
      hintPulseTimer = null;
    }, 1800);
  }

  function setPercent(value, { animate = true } = {}) {
    currentPercent = clampPercent(value);
    syncDisplayedPercent();
    setFillWidth(currentPercent, animate);
    persistPercent();
  }

  function incrementPercent(step = 1, options = {}) {
    setPercent(currentPercent + step, options);
  }

  toggle?.addEventListener('click', () => {
    const isOpen = !root.classList.contains('is-open');
    root.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) {
      replayProgressAnimation();
      replayProgressValue();
      scheduleProgressAutoClose();
    } else if (progressAutoCloseTimer) {
      window.clearTimeout(progressAutoCloseTimer);
      progressAutoCloseTimer = null;
    }
  });

  hintButton?.addEventListener('click', () => {
    if (!hintModal) return;
    hintModal.hidden = false;
  });

  hintModalClose?.addEventListener('click', closeHintModal);

  hintModal?.addEventListener('click', (event) => {
    if (event.target === hintModal) {
      closeHintModal();
    }
  });

  hintActionButton?.addEventListener('click', () => {
    if (actionButtonHref) {
      window.location.href = actionButtonHref;
      return;
    }
    closeHintModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && hintModal && !hintModal.hidden) {
      closeHintModal();
    }
  });

  syncDisplayedPercent();
  setFillWidth(currentPercent, false);
  persistPercent();
  renderHintLines(currentLines);

  window.HintProgress = {
    getPercent: () => currentPercent,
    setPercent,
    incrementPercent,
    pulse: pulseToggle,
    setLines
  };
});
