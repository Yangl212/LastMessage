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
  const irColMid = document.querySelector('.ir-col-mid');
  const irPaper = document.querySelector('.ir-paper');
  const irPaperBody = document.querySelector('.ir-paper-body');
  const irColRight = document.querySelector('.ir-col-right');
  const paperScrollbar = document.getElementById('paperScrollbar');
  const paperScrollTrack = document.getElementById('paperScrollTrack');
  const paperScrollThumb = document.getElementById('paperScrollThumb');

  const transcriptLines = [
    { text: '您好，这里是市警察局。请问有什么可以帮您？', align: 'right', marker: 'right' },
    { text: '我妹妹……几天前，她的案子被判定为自杀。但我不相信她会自己结束生命。', align: 'left', marker: 'left', spacer: 'md' },
    { text: '她叫林艾乐……求你了……她才16岁。', align: 'left', marker: 'left' },
    { text: '听到这个消息我很遗憾。', align: 'right', marker: 'right', spacer: 'md' },
    { text: '她去世前有没有发生什么不寻常的事？', align: 'right', marker: 'right' },
    { text: '一切看起来都很正常……', align: 'left', marker: 'left', spacer: 'md' },
    { text: '但我在她的日记里发现了一个很奇怪的网站。', align: 'left', marker: 'left' },
    { text: '我觉得这一切都是被安排好的……有人逼她、操控她。', align: 'left', marker: 'left' },
    { text: '你能把那个网址提供给我们吗？', align: 'right', marker: 'right', spacer: 'md' },
    { text: '当然可以！求你们了……我只是想知道真相。', align: 'left', marker: 'left', spacer: 'md' }
  ];

  let audioCtx, analyser, dataArray, animationId, sourceNode;
  let transcriptTypingToken = 0;
  let isAnswered = false;
  let isDraggingPaperThumb = false;
  let paperThumbPointerOffset = 0;

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

      fitPaperBodyToViewport();
      alignRightColumnToPaper();
      window.requestAnimationFrame(fitPaperBodyToViewport);
      window.requestAnimationFrame(alignRightColumnToPaper);
      window.setTimeout(fitPaperBodyToViewport, 60);
      window.setTimeout(alignRightColumnToPaper, 60);
      setupPaperScrollbar();

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

  function fitPaperBodyToViewport() {
    if (!irPaperBody) return;
    const cssGap = irPage
      ? Number.parseFloat(window.getComputedStyle(irPage).getPropertyValue('--bottom-align-gap')) || 40
      : 40;
    const rect = irPaperBody.getBoundingClientRect();
    const available = Math.max(160, Math.floor(window.innerHeight - rect.top - cssGap));
    irPaperBody.style.height = `${available}px`;
  }

  function alignRightColumnToPaper() {
    if (!irBody || !irPaper || !irColRight) return;
    fitPaperBodyToViewport();
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

    syncPaperScrollbarGeometry();
  }

  window.addEventListener('resize', () => {
    syncCanvasSize();
    if (!isAnswered) return;
    fitPaperBodyToViewport();
    alignRightColumnToPaper();
    window.requestAnimationFrame(fitPaperBodyToViewport);
    window.requestAnimationFrame(alignRightColumnToPaper);
    window.requestAnimationFrame(syncPaperScrollbarGeometry);
  });

  function setupPaperScrollbar() {
    if (!irPaperBody || !paperScrollbar || !paperScrollTrack || !paperScrollThumb) return;
    syncPaperScrollbarGeometry();

    irPaperBody.addEventListener('scroll', updatePaperScrollbarThumb);

    paperScrollThumb.addEventListener('pointerdown', (event) => {
      isDraggingPaperThumb = true;
      const thumbRect = paperScrollThumb.getBoundingClientRect();
      paperThumbPointerOffset = event.clientY - thumbRect.top;
      paperScrollThumb.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });

    paperScrollTrack.addEventListener('pointerdown', (event) => {
      if (event.target === paperScrollThumb) return;
      paperThumbPointerOffset = paperScrollThumb.offsetHeight / 2;
      setPaperScrollByPointer(event.clientY);
    });

    window.addEventListener('pointermove', (event) => {
      if (!isDraggingPaperThumb) return;
      setPaperScrollByPointer(event.clientY);
    });

    window.addEventListener('pointerup', () => {
      isDraggingPaperThumb = false;
    });

    paperScrollbar.addEventListener('wheel', (event) => {
      if (!irPaperBody) return;
      event.preventDefault();
      irPaperBody.scrollTop += event.deltaY;
      updatePaperScrollbarThumb();
    }, { passive: false });
  }

  function syncPaperScrollbarGeometry() {
    if (!irColMid || !irPaperBody || !paperScrollbar) return;
    const midRect = irColMid.getBoundingClientRect();
    const bodyRect = irPaperBody.getBoundingClientRect();
    const top = Math.max(0, Math.round(bodyRect.top - midRect.top));
    const height = Math.max(80, Math.round(bodyRect.height));
    paperScrollbar.style.top = `${top}px`;
    paperScrollbar.style.height = `${height}px`;
    updatePaperScrollbarThumb();
  }

  function updatePaperScrollbarThumb() {
    if (!irPaperBody || !paperScrollTrack || !paperScrollThumb) return;
    const maxScroll = Math.max(0, irPaperBody.scrollHeight - irPaperBody.clientHeight);
    const usableHeight = Math.max(8, paperScrollTrack.clientHeight - 4);
    const thumbHeight = maxScroll === 0
      ? usableHeight
      : Math.max(36, Math.round((irPaperBody.clientHeight / irPaperBody.scrollHeight) * usableHeight));
    const travel = Math.max(0, usableHeight - thumbHeight);
    const ratio = maxScroll === 0 ? 0 : irPaperBody.scrollTop / maxScroll;
    const thumbTop = 2 + Math.round(travel * ratio);

    paperScrollThumb.style.height = `${thumbHeight}px`;
    paperScrollThumb.style.top = `${thumbTop}px`;
  }

  function setPaperScrollByPointer(clientY) {
    if (!irPaperBody || !paperScrollTrack || !paperScrollThumb) return;
    const maxScroll = Math.max(0, irPaperBody.scrollHeight - irPaperBody.clientHeight);
    if (maxScroll === 0) return;

    const trackRect = paperScrollTrack.getBoundingClientRect();
    const usableHeight = Math.max(8, paperScrollTrack.clientHeight - 4);
    const thumbHeight = paperScrollThumb.offsetHeight;
    const minTop = 2;
    const maxTop = minTop + Math.max(0, usableHeight - thumbHeight);
    const desiredTop = clientY - trackRect.top - paperThumbPointerOffset;
    const nextTop = Math.min(maxTop, Math.max(minTop, desiredTop));
    const ratio = maxTop === minTop ? 0 : (nextTop - minTop) / (maxTop - minTop);

    irPaperBody.scrollTop = ratio * maxScroll;
    updatePaperScrollbarThumb();
  }

  // ── Transcript ────────────────────────────────────────────────────────────
  function renderTranscript() {
    if (!transcriptList) return;
    transcriptTypingToken += 1;
    transcriptList.innerHTML = '';
    let lastSpeaker = '';
    transcriptLines.forEach((line) => {
      const li = document.createElement('li');
      li.className = [
        'ir-transcript-line',
        line.align === 'right' ? 'ir-line-right' : 'ir-line-left',
        line.marker === 'right' ? 'ir-dot-right' : line.marker === 'left' ? 'ir-dot-left' : '',
        line.spacer === 'md' ? 'ir-line-gap-md' : line.spacer === 'lg' ? 'ir-line-gap-lg' : ''
      ].filter(Boolean).join(' ');

      const speakerKey = line.align === 'right' ? 'officer' : 'caller';
      if (speakerKey !== lastSpeaker) {
        const speakerNode = document.createElement('span');
        speakerNode.className = 'ir-speaker-label';
        speakerNode.textContent = speakerKey === 'officer' ? '■ 警员：' : '■ 来电者：';
        li.appendChild(speakerNode);
        lastSpeaker = speakerKey;
      }

      li.dataset.fullText = line.text;
      const textNode = document.createElement('span');
      textNode.className = 'ir-transcript-text';
      textNode.textContent = '';
      li.appendChild(textNode);
      transcriptList.appendChild(li);
    });
    if (irPaperBody) irPaperBody.scrollTop = 0;
    fitPaperBodyToViewport();
    syncPaperScrollbarGeometry();
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
      lineEl.classList.add('is-speaker-visible');
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
        updatePaperScrollbarThumb();
        const char = fullText[cursor - 1];
        const delay = /[，。！？；：,.!?]/.test(char) ? 170 : 72;
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
