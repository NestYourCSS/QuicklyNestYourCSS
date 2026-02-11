(function() {
  const toggleBtn = document.getElementById('settings-toggle');
  const popover = document.getElementById('settings-popover');

  // Toggle popover
  toggleBtn.addEventListener('click', (e) => {
    popover.classList.toggle('hidden');
    e.stopPropagation();
  });

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== toggleBtn) {
      popover.classList.add('hidden');
    }
  });

  // Default settings
  const defaults = {
    'mode': '3',
    'comments': 'true',
    'auto': 'true',
    'font': "'Fira Code', monospace",
    'fontsize': '16',
    'indent-type': 'tab',
    'indent-size': '4',
    'word-wrap': 'false',
    'coords': '3'
  };

  // Load from localStorage
  const settings = {};
  Object.keys(defaults).forEach(key => {
    settings[key] = localStorage.getItem('nycss-setting-' + key) || defaults[key];
  });

  // Initialize UI
  function initUI() {
    // Dropdowns
    document.getElementById('setting-font').value = settings['font'];
    document.getElementById('setting-fontsize').value = settings['fontsize'];
    document.getElementById('setting-indent-size').value = settings['indent-size'];

    // Segmented controls
    document.querySelectorAll('.segmented-control').forEach(control => {
      const setting = control.dataset.setting;
      const value = settings[setting];
      control.querySelectorAll('button').forEach(btn => {
        if (btn.value === value) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });
  }

  // Apply settings to app
  function applySettings() {
    window.processMode = parseInt(settings['mode']);
    window.preserveComments = settings['comments'] === 'true';

    // Support both variable names as requested in review
    window.autoProcess = settings['auto'] === 'true';
    window.processAuto = window.autoProcess;

    const editors = [window.inputEditor, window.outputEditor];
    if (!editors[0]) return;

    const fontSize = parseInt(settings['fontsize']);
    const fontFamily = settings['font'];
    const useWrapMode = settings['word-wrap'] === 'true';
    const indentType = settings['indent-type'];
    const indentSize = parseInt(settings['indent-size']);

    const indentChar = indentType === 'tab' ? '\t' : ' '.repeat(indentSize);
    window.editorIndentChar = indentChar;

    editors.forEach(editor => {
      if (!editor) return;

      editor.setOptions({
        fontFamily: fontFamily,
        fontSize: fontSize + "px"
      });

      editor.getSession().setUseWrapMode(useWrapMode);

      // Tab settings
      editor.getSession().setTabSize(indentType === 'tab' ? 4 : indentSize);
      editor.getSession().setUseSoftTabs(indentType === 'space');
    });

    updateCoordinateDisplay();

    if (window.autoProcess && typeof window.nestCode === 'function') {
        window.nestCode();
    }

    updateNestButton();
  }

  function updateCoordinateDisplay() {
    const coordsMode = parseInt(settings['coords']);
    const editors = [window.inputEditor, window.outputEditor];

    editors.forEach(editor => {
        if (!editor) return;

        // Use Ace's gutter for Line numbers if mode includes Line (1 or 3)
        editor.renderer.setShowGutter(coordsMode === 1 || coordsMode === 3);

        const tab = editor.container.parentElement.querySelector('.editorTab');
        if (!tab) return;

        const coordsEl = tab.querySelector('.editorCoordinates');
        if (!coordsEl) return;

        if (coordsMode === 0) {
            coordsEl.classList.add('hidden');
        } else {
            coordsEl.classList.remove('hidden');
            updateCoordText(editor, coordsEl, coordsMode);
        }
    });
  }

  function updateCoordText(editor, el, mode) {
    const pos = editor.getCursorPosition();
    const line = pos.row + 1;
    const col = pos.column + 1;

    if (mode === 1) el.textContent = `Line ${line}`;
    else if (mode === 2) el.textContent = `Col ${col}`;
    else if (mode === 3) el.textContent = `Line ${line}, Col ${col}`;
  }

  function updateNestButton() {
    const nestBtn = document.getElementById('nest-btn');
    if (!nestBtn) return;

    const modeLabels = {
        '0': 'Minify!',
        '1': 'Beautify!',
        '2': 'Denest!',
        '3': 'Nest!'
    };
    nestBtn.textContent = modeLabels[settings['mode']] || 'Nest!';

    if (window.autoProcess) {
        nestBtn.innerText = 'Auto';
        nestBtn.classList.remove('vibrant');
        nestBtn.classList.add('neutral');
        nestBtn.disabled = true;
    } else {
        nestBtn.classList.add('vibrant');
        nestBtn.classList.remove('neutral');
        nestBtn.disabled = false;

        const modeColors = {
            '0': '--red-colour-medium',
            '1': '--pri-colour-medium',
            '2': '--pri-colour-lighter',
            '3': '--sec-colour-medium'
        };
        const colorVar = modeColors[settings['mode']] || '--sec-colour-medium';
        nestBtn.style.setProperty('--vibrant-color', `var(${colorVar})`);
    }
  }

  // Event Listeners
  document.getElementById('setting-font').addEventListener('change', (e) => {
    updateSetting('font', e.target.value);
  });

  document.getElementById('setting-fontsize').addEventListener('change', (e) => {
    updateSetting('fontsize', e.target.value);
  });

  document.getElementById('setting-indent-size').addEventListener('input', (e) => {
    updateSetting('indent-size', e.target.value);
  });

  document.querySelectorAll('.segmented-control button').forEach(button => {
    button.addEventListener('click', () => {
      const parent = button.parentElement;
      const setting = parent.dataset.setting;
      const value = button.value;

      parent.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      updateSetting(setting, value);
    });
  });

  function updateSetting(key, value) {
    settings[key] = value;
    localStorage.setItem('nycss-setting-' + key, value);
    applySettings();
  }

  // Initialize
  const checkEditors = setInterval(() => {
    // Support both variable names as mentioned in review
    const input = window.inputEditor || window.inputEditorInstance;
    const output = window.outputEditor || window.outputEditorInstance;

    if (input && output) {
      window.inputEditor = input;
      window.outputEditor = output;

      initUI();
      applySettings();

      // Setup cursor listeners for coordinates
      [window.inputEditor, window.outputEditor].forEach(editor => {
          editor.selection.on('changeCursor', () => {
              const tab = editor.container.parentElement.querySelector('.editorTab');
              const coordsEl = tab?.querySelector('.editorCoordinates');
              if (coordsEl) {
                  updateCoordText(editor, coordsEl, parseInt(settings['coords']));
              }
          });
      });

      clearInterval(checkEditors);
    }
  }, 100);

})();
