/* ============================================================
   DrawMe ProMax — voice.js
   Web Speech API voice commands
   ============================================================ */

const VOICE = {
  recognition: null,
  active: false,
};

function toggleVoice() {
  if (VOICE.active) {
    stopVoice();
  } else {
    startVoice();
  }
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('⚠️ Voice commands not supported in this browser');
    return;
  }

  VOICE.recognition = new SpeechRecognition();
  VOICE.recognition.continuous = true;
  VOICE.recognition.interimResults = true;
  VOICE.recognition.lang = 'en-US';

  VOICE.recognition.onstart = () => {
    VOICE.active = true;
    document.getElementById('voice-indicator').classList.add('active');
    document.getElementById('voice-status-text').textContent = 'Listening...';
    document.getElementById('voice-toggle-btn').textContent = '🛑 Stop Listening';
    document.getElementById('voice-toggle-btn').classList.add('listening');
  };

  VOICE.recognition.onresult = (event) => {
    let final = '';
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    const display = final || interim;
    document.getElementById('voice-transcript').textContent = display;
    if (final) processVoiceCommand(final.toLowerCase().trim());
  };

  VOICE.recognition.onerror = (e) => {
    showToast('🎙️ Voice error: ' + e.error);
    stopVoice();
  };

  VOICE.recognition.onend = () => {
    if (VOICE.active) VOICE.recognition.start(); // Keep listening
  };

  VOICE.recognition.start();
}

function stopVoice() {
  VOICE.active = false;
  if (VOICE.recognition) VOICE.recognition.stop();
  document.getElementById('voice-indicator').classList.remove('active');
  document.getElementById('voice-status-text').textContent = 'Microphone off';
  document.getElementById('voice-toggle-btn').textContent = '🎙️ Start Listening';
  document.getElementById('voice-toggle-btn').classList.remove('listening');
  document.getElementById('voice-transcript').textContent = 'Waiting for command...';
}

// ──────────── COMMAND PROCESSOR ────────────
function processVoiceCommand(cmd) {
  document.getElementById('voice-transcript').textContent = '🎙️ "' + cmd + '"';

  // ── Extended shape commands via shapes.js ──
  if (typeof window._extendVoiceCommands === 'function') {
    if (window._extendVoiceCommands(cmd)) {
      voiceFeedback('Shape drawn!');
      return;
    }
  }

  // ── Basic shapes (stored as movable objects) ──
  if (cmd.includes('circle') && !cmd.includes('cylinder')) {
    drawShapeAtCenter('circle'); voiceFeedback('Drawing circle'); return;
  }
  if (cmd.includes('rectangle') || cmd.includes('draw rect')) {
    drawShapeAtCenter('rect'); voiceFeedback('Drawing rectangle'); return;
  }
  if (cmd.includes('square')) {
    drawShapeAtCenter('square'); voiceFeedback('Drawing square'); return;
  }
  if (cmd.includes('line') && !cmd.includes('outline')) {
    drawShapeAtCenter('line'); voiceFeedback('Drawing line'); return;
  }
  if (cmd.includes('triangle')) {
    drawShapeAtCenter('triangle'); voiceFeedback('Drawing triangle'); return;
  }
  if (cmd.includes('cylinder')) {
    drawShapeAtCenter('cylinder'); voiceFeedback('Drawing cylinder'); return;
  }
  if (cmd.includes('cone')) {
    drawShapeAtCenter('cone'); voiceFeedback('Drawing cone'); return;
  }
  if (cmd.includes('hexagon')) {
    drawShapeAtCenter('hexagon'); voiceFeedback('Drawing hexagon'); return;
  }
  if (cmd.includes('pentagon')) {
    drawShapeAtCenter('pentagon'); voiceFeedback('Drawing pentagon'); return;
  }
  if (cmd.includes('octagon')) {
    drawShapeAtCenter('octagon'); voiceFeedback('Drawing octagon'); return;
  }
  if (cmd.includes('diamond') || cmd.includes('rhombus')) {
    drawShapeAtCenter('diamond'); voiceFeedback('Drawing diamond'); return;
  }
  if (cmd.includes('star')) {
    drawShapeAtCenter('star'); voiceFeedback('Drawing star'); return;
  }
  if (cmd.includes('arrow') && !cmd.includes('sparrow')) {
    drawShapeAtCenter('arrow'); voiceFeedback('Drawing arrow'); return;
  }
  if (cmd.includes('crescent') || (cmd.includes('moon') && !cmd.includes('sunflower'))) {
    drawShapeAtCenter('crescent'); voiceFeedback('Drawing crescent moon'); return;
  }
  if (cmd.includes('cross') || cmd.includes('plus sign')) {
    drawShapeAtCenter('cross'); voiceFeedback('Drawing cross'); return;
  }
  if (cmd.includes('parallelogram')) {
    drawShapeAtCenter('parallelogram'); voiceFeedback('Drawing parallelogram'); return;
  }

  // ── Complex/nature/object commands (movable voice objects) ──
  if (cmd.includes('sun') && !cmd.includes('sunflower')) {
    addVoiceObject('sun'); voiceFeedback('Drawing sun'); return;
  }
  if (cmd.includes('sunflower')) {
    addVoiceObject('sunflower'); voiceFeedback('Drawing sunflower'); return;
  }
  if (cmd.includes('flower') && !cmd.includes('sunflower')) {
    addVoiceObject('flower'); voiceFeedback('Drawing flower'); return;
  }
  if (cmd.includes('tree') && !cmd.includes('christmas')) {
    addVoiceObject('tree'); voiceFeedback('Drawing tree'); return;
  }
  if (cmd.includes('cloud')) {
    addVoiceObject('cloud'); voiceFeedback('Drawing cloud'); return;
  }
  if (cmd.includes('mountain')) {
    addVoiceObject('mountain'); voiceFeedback('Drawing mountain'); return;
  }
  if (cmd.includes('rainbow')) {
    addVoiceObject('rainbow'); voiceFeedback('Drawing rainbow'); return;
  }
  if (cmd.includes('wave') || cmd.includes('ocean')) {
    addVoiceObject('wave'); voiceFeedback('Drawing wave'); return;
  }
  if (cmd.includes('lightning') || cmd.includes('bolt')) {
    addVoiceObject('lightning'); voiceFeedback('Drawing lightning bolt'); return;
  }
  if (cmd.includes('snowflake')) {
    addVoiceObject('snowflake'); voiceFeedback('Drawing snowflake'); return;
  }
  if (cmd.includes('leaf')) {
    addVoiceObject('leaf'); voiceFeedback('Drawing leaf'); return;
  }
  if (cmd.includes('house') || cmd.includes('home')) {
    addVoiceObject('house'); voiceFeedback('Drawing house'); return;
  }
  if (cmd.includes('heart')) {
    addVoiceObject('heart'); voiceFeedback('Drawing heart'); return;
  }
  if (cmd.includes('smiley') || cmd.includes('happy face')) {
    addVoiceObject('smiley'); voiceFeedback('Drawing smiley face'); return;
  }
  if (cmd.includes('clock')) {
    addVoiceObject('clock'); voiceFeedback('Drawing clock'); return;
  }
  if (cmd.includes('umbrella')) {
    addVoiceObject('umbrella'); voiceFeedback('Drawing umbrella'); return;
  }
  if (cmd.includes('car')) {
    addVoiceObject('car'); voiceFeedback('Drawing car'); return;
  }
  if (cmd.includes('rocket')) {
    addVoiceObject('rocket'); voiceFeedback('Drawing rocket'); return;
  }
  if (cmd.includes('fish')) {
    addVoiceObject('fish'); voiceFeedback('Drawing fish'); return;
  }
  if (cmd.includes('butterfly')) {
    addVoiceObject('butterfly'); voiceFeedback('Drawing butterfly'); return;
  }
  if (cmd.includes('crown')) {
    addVoiceObject('crown'); voiceFeedback('Drawing crown'); return;
  }
  if (cmd.includes('gift') || cmd.includes('present')) {
    addVoiceObject('gift'); voiceFeedback('Drawing gift box'); return;
  }
  if (cmd.includes('music') || cmd.includes('musical note')) {
    addVoiceObject('music'); voiceFeedback('Drawing musical note'); return;
  }

  // Board control
  if (cmd.includes('clear board') || cmd.includes('clear all') || cmd.includes('erase board')) {
    clearBoard(); voiceFeedback('Board cleared'); return;
  }
  if (cmd.includes('undo')) { undoAction(); voiceFeedback('Undo'); return; }
  if (cmd.includes('redo')) { redoAction(); voiceFeedback('Redo'); return; }

  // Tool selection
  if (cmd.includes('start drawing') || cmd.includes('pencil')) {
    setTool('pencil'); voiceFeedback('Pencil selected'); return;
  }
  if (cmd.includes('stop drawing') || cmd.includes('select tool')) {
    setTool('select'); voiceFeedback('Selection tool'); return;
  }
  if (cmd.includes('eraser') || cmd.includes('erase')) {
    setTool('eraser'); voiceFeedback('Eraser selected'); return;
  }

  // Color changes
  const colorMap = {
    'red': '#ff0000', 'blue': '#0000ff', 'green': '#00aa00',
    'yellow': '#ffcc00', 'black': '#000000', 'white': '#ffffff',
    'purple': '#8800ff', 'orange': '#ff7700', 'pink': '#ff44aa',
    'cyan': '#00e5ff', 'brown': '#884400', 'gray': '#888888', 'grey': '#888888',
    'teal': '#008080', 'magenta': '#ff00ff', 'lime': '#00ff00',
    'navy': '#000080', 'maroon': '#800000', 'olive': '#808000',
    'coral': '#ff7f50', 'turquoise': '#40e0d0', 'violet': '#8b00ff',
    'gold': '#ffd700', 'silver': '#c0c0c0',
  };
  for (const [name, hex] of Object.entries(colorMap)) {
    if (cmd.includes('color to ' + name) || cmd.includes('colour to ' + name) || cmd.includes('change color ' + name)) {
      setColor(hex);
      document.getElementById('color-picker').value = hex;
      voiceFeedback('Color: ' + name);
      return;
    }
  }

  // Sticky note
  if (cmd.includes('add sticky') || cmd.includes('sticky note')) {
    addSticky(); voiceFeedback('Sticky note added'); return;
  }

  // Call
  if (cmd.includes('start call') || cmd.includes('join call')) {
    joinVoiceCall(); switchPanel('call'); voiceFeedback('Joining call'); return;
  }
  if (cmd.includes('end call') || cmd.includes('leave call')) {
    leaveVoiceCall(); voiceFeedback('Left call'); return;
  }

  // Zoom
  if (cmd.includes('zoom in')) { zoomIn(); voiceFeedback('Zooming in'); return; }
  if (cmd.includes('zoom out')) { zoomOut(); voiceFeedback('Zooming out'); return; }

  // Dark mode
  if (cmd.includes('dark mode') || cmd.includes('light mode')) {
    toggleDarkMode(); voiceFeedback('Mode toggled'); return;
  }
}

function voiceFeedback(msg) {
  showToast('🎙️ ' + msg);
  addToTimeline(`${APP.user.name} used voice: ${msg}`);
}
