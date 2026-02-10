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
    window.autoProcess = settings['auto'] === 'true';

    const editors = [window.inputEditor, window.outputEditor];
    if (!editors[0]) return;

    const fontSize = parseInt(settings['fontsize']);
    const fontFamily = settings['font'];
    const useWrapMode = settings['word-wrap'] === 'true';
    const coordsMode = parseInt(settings['coords']);
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

      // Handle Gutter (Coordinates)
      // 0: None, 1: Line, 2: Col, 3: Both
      // Ace renderer.setShowGutter handles the line numbers
      editor.renderer.setShowGutter(coordsMode === 1 || coordsMode === 3);

      // Tab settings
      editor.getSession().setTabSize(indentType === 'tab' ? 4 : indentSize);
      editor.getSession().setUseSoftTabs(indentType === 'space');
    });

    // Update coordinates display if it exists in UI
    updateCoordinateDisplay();

    if (window.autoProcess && window.nestCode) window.nestCode();

    // Update Nest button style
    updateNestButton();
  }

  function updateCoordinateDisplay() {
    const coordsMode = parseInt(settings['coords']);
    document.querySelectorAll('.editorCoordinates').forEach(el => {
        // Toggle visibility based on mode
        if (coordsMode === 0) {
            el.classList.add('hidden');
        } else {
            el.classList.remove('hidden');
            // Logic for Line vs Col would go in Ace's changeCursor event,
            // but we can at least toggle the container here.
        }
    });
  }

  function updateNestButton() {
    const nestBtn = document.querySelector('#code-editor-wrapper > button');
    if (!nestBtn) return;

    const modeLabels = {
        '0': 'Minify!',
        '1': 'Beautify!',
        '2': 'Denest!',
        '3': 'Nest!'
    };
    nestBtn.textContent = modeLabels[settings['mode']] || 'Nest!';

    // Update colors based on mode
    const modeColors = {
        '0': '--red-colour-medium',
        '1': '--pri-colour-medium',
        '2': '--pri-colour-lighter',
        '3': '--sec-colour-medium'
    };
    const colorVar = modeColors[settings['mode']] || '--sec-colour-medium';
    nestBtn.style.background = `var(${colorVar})`;
    nestBtn.style.boxShadow = `0 0 20px var(${colorVar})`;
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
    if (window.inputEditor && window.outputEditor) {
      initUI();
      applySettings();
      clearInterval(checkEditors);
    }
  }, 100);

})();
