// Incoming call flow for introduction page
document.addEventListener('DOMContentLoaded', () => {
  const ringtone = document.getElementById('ringtone');
  const answerBtn = document.getElementById('answerBtn');
  const callScreen = document.getElementById('callScreen');
  const briefing = document.getElementById('briefing');
  const callAudio = document.getElementById('callAudio');
  const waveform = document.getElementById('waveform');
  const transcriptList = document.getElementById('transcriptList');
  const audioStatus = document.getElementById('audioStatus');

  const transcriptLines = [
    { time: 0, text: 'Police: Hello, this is the City Police Department. How can I help you?' },
    { time: 4, text: 'Unknow: My sister... her case was ruled a suicide a few days ago. But I do not believe she would take her own life.' },
    { time: 11, text: 'Police: I understand how you feel.' },
    { time: 14, text: 'Police: But since the case has already been closed, we will need more information to reopen the investigation.' },
    { time: 20, text: "Police: Your sister's name is... Alley Lin, correct?" },
    { time: 25, text: 'Unknow: Yes. And she is sixteen years old.' },
    { time: 29, text: 'Police: Still in high school. Did anything unusual happen to her before her death?' },
    { time: 35, text: 'Unknow: Everything seemed normal...' },
    { time: 38, text: 'Unknow: But I found a mysterious website in her diary.' },
    { time: 42, text: 'Unknow: I think everything was planned... Someone forced her, manipulated her.' },
    { time: 48, text: 'Police: A website from her diary?' },
    { time: 51, text: 'Police: Could you provide us with the URL?' },
    { time: 54, text: 'Police: We will begin with a cyber investigation and file your statement.' },
    { time: 60, text: 'Unknow: Please... I just want the truth.' }
  ];

  let audioCtx;
  let analyser;
  let dataArray;
  let animationId;
  let sourceNode;

  const startRingtone = () => {
    if (!ringtone) return;
    const play = ringtone.play();
    if (play && typeof play.catch === 'function') {
      play.catch(() => {
        // Some browsers require a user gesture; retry on first interaction.
      });
    }
  };

  // Attempt autoplay on load
  startRingtone();
  // Ensure at least one user gesture will trigger it if blocked
  const enableOnGesture = () => {
    startRingtone();
    document.removeEventListener('pointerdown', enableOnGesture);
  };
  document.addEventListener('pointerdown', enableOnGesture, { once: true });

  if (answerBtn) {
    answerBtn.addEventListener('click', () => {
      if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
      }
      if (briefing) {
        briefing.classList.remove('hidden');
      }
      if (callScreen) callScreen.classList.add('answered');
      if (callAudio) {
        ensureWaveform();
        renderTranscript();
        const playAudio = callAudio.play();
        if (playAudio && typeof playAudio.catch === 'function') {
          playAudio.catch(() => {
            // Autoplay might be blocked; user can press play manually.
          });
        }
      }
    });
  }

  function ensureWaveform() {
    if (!callAudio || !waveform) return;
    resizeWaveform();
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (!sourceNode) {
      sourceNode = audioCtx.createMediaElementSource(callAudio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
    drawWaveform();
  }

  function drawWaveform() {
    if (!analyser || !waveform) return;
    const canvasCtx = waveform.getContext('2d');
    if (!canvasCtx) return;

    const width = waveform.width;
    const height = waveform.height;

    const render = () => {
      analyser.getByteTimeDomainData(dataArray);
      canvasCtx.fillStyle = '#0b1324';
      canvasCtx.fillRect(0, 0, width, height);

      canvasCtx.lineWidth = 2;
      const grad = canvasCtx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#39c7c7');
      grad.addColorStop(1, '#25ffaa');
      canvasCtx.strokeStyle = grad;
      canvasCtx.beginPath();

      const sliceWidth = width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();
      animationId = requestAnimationFrame(render);
    };
    cancelAnimationFrame(animationId);
    render();
  }

  function resizeWaveform() {
    if (!waveform) return;
    const { clientWidth } = waveform;
    waveform.width = clientWidth;
    waveform.height = 220;
  }

  function renderTranscript() {
    if (!transcriptList) return;
    transcriptList.innerHTML = '';
    transcriptLines.forEach((line, idx) => {
      const li = document.createElement('li');
      li.className = 'transcript-line';
      li.dataset.index = idx;
      li.textContent = line.text;
      transcriptList.appendChild(li);
    });
  }

  function updateTranscript() {
    if (!callAudio || !transcriptList) return;
    const current = callAudio.currentTime;
    let activeIndex = -1;
    for (let i = transcriptLines.length - 1; i >= 0; i--) {
      if (current >= transcriptLines[i].time) {
        activeIndex = i;
        break;
      }
    }
    transcriptList.querySelectorAll('.transcript-line').forEach((el) => {
      const idx = Number(el.dataset.index);
      el.classList.toggle('active', idx === activeIndex);
    });
  }

  function updateStatus() {
    if (!audioStatus || !callAudio) return;
    if (callAudio.paused) {
      audioStatus.textContent = 'Paused';
    } else {
      audioStatus.textContent = 'Playing';
    }
  }

  if (callAudio) {
    callAudio.addEventListener('timeupdate', updateTranscript);
    callAudio.addEventListener('play', () => {
      updateStatus();
      ensureWaveform();
    });
    callAudio.addEventListener('pause', updateStatus);
    callAudio.addEventListener('ended', () => {
      updateStatus();
      updateTranscript();
      cancelAnimationFrame(animationId);
    });
  }

  // Keep waveform width in sync with layout
  window.addEventListener('resize', resizeWaveform);
});
