// Incoming call flow for introduction page
document.addEventListener('DOMContentLoaded', () => {
  const ringtone    = document.getElementById('ringtone');
  const answerBtn   = document.getElementById('answerBtn');
  const callScreen  = document.getElementById('callScreen');
  const briefing    = document.getElementById('briefing');
  const callAudio   = document.getElementById('callAudio');
  const waveform    = document.getElementById('waveform');
  const transcriptList = document.getElementById('transcriptList');
  const irPage = document.querySelector('.ir-page');
  const irBody = document.querySelector('.ir-body');
  const irPaper = document.querySelector('.ir-paper');
  const irColRight = document.querySelector('.ir-col-right');

  const transcriptLines = [
    { text: 'Hello, this is the City Police Department. How can I help you?', align: 'right', marker: 'right' },
    { text: 'My sister... her case was ruled a suicide a few days ago. But I do not believe she would take her own life.', align: 'left', marker: 'left', spacer: 'md' },
    { text: 'Her name is Allery Lin... please...She just 16 years old.', align: 'left', marker: 'left' },
    { text: "I’m sorry to heard that.", align: 'right', marker: 'right', spacer: 'md' },
    { text: 'Did anything unusual happen to her before her death?', align: 'right', marker: 'right' },
    { text: 'Everything seemed normal...', align: 'left', marker: 'left', spacer: 'md' },
    { text: 'But I found a mysterious website in her diary.', align: 'left', marker: 'left' },
    { text: 'I think everything was planned... Someone forced her, manipulated her .', align: 'left', marker: 'left' },
    { text: 'Could you provide us with the URL?', align: 'right', marker: 'right', spacer: 'md' },
    { text: 'Sure! Please... I  just want the truth.', align: 'left', marker: 'left', spacer: 'md' }
  ];

  let audioCtx, analyser, dataArray, animationId, sourceNode;
  let transcriptTypingToken = 0;
  let isAnswered = false;

  // ── Ringtone autoplay ─────────────────────────────────────────────────────
  const startRingtone = () => {
    if (!ringtone) return;
    ringtone.play().catch(() => {});
  };
  startRingtone();
  document.addEventListener('pointerdown', startRingtone, { once: true });

  // ── Answer button ─────────────────────────────────────────────────────────
  if (answerBtn) {
    answerBtn.addEventListener('click', () => {
      isAnswered = true;
      if (ringtone) { ringtone.pause(); ringtone.currentTime = 0; }
      if (briefing) briefing.classList.remove('hidden');
      if (callScreen) callScreen.classList.add('answered');

      alignRightColumnToPaper();
      window.requestAnimationFrame(alignRightColumnToPaper);
      window.setTimeout(alignRightColumnToPaper, 60);

      renderTranscript();
      if (callAudio) {
        initWaveform();
        callAudio.play().catch(() => {});
      }
    });
  }

  // ── Waveform ──────────────────────────────────────────────────────────────
  function initWaveform() {
    if (!callAudio || !waveform) return;
    syncCanvasSize();

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (!sourceNode) {
      sourceNode = audioCtx.createMediaElementSource(callAudio);
      analyser   = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArray  = new Uint8Array(analyser.frequencyBinCount);
    }
    cancelAnimationFrame(animationId);
    drawWaveform();
  }

  function drawWaveform() {
    if (!analyser || !waveform) return;
    const ctx = waveform.getContext('2d');
    const W   = waveform.width;
    const H   = waveform.height;

    const render = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, W, H);

      // Draw as vertical bars (spectrum style) in white/grey, matching the image
      const barCount = 80;
      const gap      = 2;
      const barW     = Math.max(1, (W - gap * (barCount - 1)) / barCount);
      const step     = Math.floor(dataArray.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const val   = dataArray[i * step] / 255;
        const barH  = Math.max(2, val * H);
        const x     = i * (barW + gap);
        const y     = (H - barH) / 2;

        // Intensity drives brightness: low → dim grey, high → bright white
        const bright = Math.floor(160 + val * 95);
        ctx.fillStyle = `rgb(${bright},${bright},${bright})`;
        ctx.fillRect(x, y, barW, barH);
      }

      animationId = requestAnimationFrame(render);
    };
    render();
  }

  // Draw a static "idle" waveform (small random noise) when paused/ended
  function drawIdle() {
    if (!waveform) return;
    const ctx = waveform.getContext('2d');
    const W   = waveform.width;
    const H   = waveform.height;
    ctx.clearRect(0, 0, W, H);

    const barCount = 80;
    const gap      = 2;
    const barW     = Math.max(1, (W - gap * (barCount - 1)) / barCount);

    for (let i = 0; i < barCount; i++) {
      const barH = 2 + Math.random() * 4;
      const x    = i * (barW + gap);
      const y    = (H - barH) / 2;
      ctx.fillStyle = '#555';
      ctx.fillRect(x, y, barW, barH);
    }
  }

  function syncCanvasSize() {
    if (!waveform) return;
    waveform.width  = waveform.clientWidth  || 260;
    waveform.height = waveform.clientHeight || 60;
  }

  function alignRightColumnToPaper() {
    if (!irBody || !irPaper || !irColRight) return;
    const bodyRect = irBody.getBoundingClientRect();
    const paperRect = irPaper.getBoundingClientRect();
    const offset = Math.max(0, Math.round(paperRect.top - bodyRect.top));
    irBody.style.setProperty('--paper-top-offset', `${offset}px`);
    irColRight.style.setProperty('--paper-top-offset', `${offset}px`);

    if (irPage) {
      const pageRect = irPage.getBoundingClientRect();
      const bottomOffset = Math.max(0, Math.round(pageRect.bottom - paperRect.bottom));
      irPage.style.setProperty('--paper-bottom-offset', `${bottomOffset}px`);
    }
  }

  window.addEventListener('resize', () => {
    syncCanvasSize();
    if (!isAnswered) return;
    alignRightColumnToPaper();
    window.requestAnimationFrame(alignRightColumnToPaper);
  });

  // ── Transcript ────────────────────────────────────────────────────────────
  function renderTranscript() {
    if (!transcriptList) return;
    transcriptTypingToken += 1;
    transcriptList.innerHTML = '';
    transcriptLines.forEach((line) => {
      const li = document.createElement('li');
      li.className = [
        'ir-transcript-line',
        line.align === 'right' ? 'ir-line-right' : 'ir-line-left',
        line.marker === 'right' ? 'ir-dot-right' : line.marker === 'left' ? 'ir-dot-left' : '',
        line.spacer === 'md' ? 'ir-line-gap-md' : line.spacer === 'lg' ? 'ir-line-gap-lg' : ''
      ].filter(Boolean).join(' ');
      li.dataset.fullText = line.text;
      const textNode = document.createElement('span');
      textNode.className = 'ir-transcript-text';
      textNode.textContent = '';
      li.appendChild(textNode);
      transcriptList.appendChild(li);
    });
    startTranscriptTypewriter();
  }

  function startTranscriptTypewriter() {
    if (!transcriptList) return;
    const lines = Array.from(transcriptList.querySelectorAll('.ir-transcript-line'));
    const token = transcriptTypingToken;

    const typeLine = (lineIndex) => {
      if (token !== transcriptTypingToken || lineIndex >= lines.length) return;
      const lineEl = lines[lineIndex];
      const textEl = lineEl.querySelector('.ir-transcript-text');
      const fullText = lineEl.dataset.fullText || '';
      if (!textEl) {
        typeLine(lineIndex + 1);
        return;
      }

      let cursor = 0;
      lineEl.classList.add('is-typing');
      lineEl.classList.add('is-dot-visible');

      const typeChar = () => {
        if (token !== transcriptTypingToken) return;
        if (cursor >= fullText.length) {
          lineEl.classList.remove('is-typing');
          const pause = lineEl.classList.contains('ir-line-gap-md') ? 680 : 460;
          window.setTimeout(() => typeLine(lineIndex + 1), pause);
          return;
        }

        cursor += 1;
        textEl.textContent = fullText.slice(0, cursor);
        const char = fullText[cursor - 1];
        const delay = /[,.!?]/.test(char) ? 150 : 64;
        window.setTimeout(typeChar, delay);
      };

      window.setTimeout(typeChar, 160);
    };

    typeLine(0);
  }

  function updateTranscript() {
    // Transcript is presented as a fixed incident report block to match the layout.
  }

  // ── Audio events ──────────────────────────────────────────────────────────
  if (callAudio) {
    callAudio.addEventListener('timeupdate', updateTranscript);
    callAudio.addEventListener('play', () => {
      if (!sourceNode) initWaveform();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      cancelAnimationFrame(animationId);
      drawWaveform();
    });
    callAudio.addEventListener('pause', () => {
      cancelAnimationFrame(animationId);
      drawIdle();
    });
    callAudio.addEventListener('ended', () => {
      cancelAnimationFrame(animationId);
      drawIdle();
    });
  }
});
