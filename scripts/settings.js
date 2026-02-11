(function() {
  const toggleBtn = document.getElementById('settings-toggle');
  const popover = document.getElementById('mainSettings');

  // Toggle popover
  toggleBtn.addEventListener('click', (e) => {
    popover.classList.toggle('hidden');
    e.stopPropagation();
  });

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== toggleBtn) {
      popover.classList.add('hidden');
    }

    // Close dropdowns when clicking outside
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
  });

  // Default settings
  const defaults = {
    'mode': '3',
    'comments': 'true',
    'auto': 'true',
    'font': "'Fira Code', monospace",
    'fontsize': '1.25rem',
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
    // Fonts
    const fontOutput = document.querySelector('#typefaces output');
    const fontOptions = {
        "'Fira Code', monospace": "Fira Code",
        "'JetBrains Mono', monospace": "Jetbrains Mono",
        "'PT Mono', monospace": "PT Mono",
        "monospace": "DejaVu Mono"
    };
    fontOutput.textContent = fontOptions[settings['font']] || "Fira Code";

    // Font Size
    const sizeOutput = document.querySelector('#fontsizes output');
    sizeOutput.textContent = settings['fontsize'];

    // Indentation Type (Checkbox: checked = Hard/Tab, unchecked = Soft/Space)
    const indentTypeCb = document.getElementById('indentation-type-checkbox');
    indentTypeCb.checked = settings['indent-type'] === 'tab';

    // Indentation Size
    const indentSizeInput = document.getElementById('indentation-size-input');
    indentSizeInput.value = settings['indent-size'];

    // Word Wrap
    const wrapCb = document.getElementById('word-wrap-checkbox');
    wrapCb.checked = settings['word-wrap'] === 'true';

    // Coordinates (Radios)
    const coordRadio = document.querySelector(`input[name="coordinates"][value="${settings['coords']}"]`);
    if (coordRadio) coordRadio.checked = true;

    // Comments (Checkbox: checked = No, unchecked = Yes)
    const commentsCb = document.getElementById('preserveComments-checkbox');
    commentsCb.checked = settings['comments'] === 'false';

    // Mode (Radios)
    const modeRadio = document.querySelector(`input[name="mode"][value="${settings['mode']}"]`);
    if (modeRadio) modeRadio.checked = true;

    // Auto
    const autoCb = document.getElementById('auto-checkbox');
    autoCb.checked = settings['auto'] === 'true';
  }

  // Apply settings to app
  function applySettings() {
    window.processMode = parseInt(settings['mode']);
    window.preserveComments = settings['comments'] === 'true';
    window.autoProcess = settings['auto'] === 'true';
    window.processAuto = window.autoProcess;

    const editors = [window.inputEditor, window.outputEditor];
    if (!editors[0]) return;

    const fontSizeStr = settings['fontsize']; // e.g. "1.25rem"
    // Convert rem to px for Ace (approximate based on body font size)
    const fontSize = parseFloat(fontSizeStr) * 16;
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
      editor.getSession().setTabSize(indentSize);
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

        editor.renderer.setShowGutter(true);

        const tab = editor.container.parentElement.querySelector('.editorTab');
        if (!tab) return;

        const fileNameEl = tab.querySelector('.fileName');
        if (!fileNameEl) return;

        if (coordsMode === 0) {
            fileNameEl.removeAttribute('cursor');
        } else {
            updateCoordText(editor, fileNameEl, coordsMode);
        }
    });
  }

  function updateCoordText(editor, el, mode) {
    const pos = editor.getCursorPosition();
    const line = pos.row + 1;
    const col = pos.column + 1;

    let text = '';
    if (mode === 1) text = line;
    else if (mode === 2) text = col;
    else if (mode === 3) text = `${line}:${col}`;

    el.setAttribute('cursor', text);
  }

  function updateNestButton() {
    const nestBtn = document.getElementById('nest-btn');
    const settingsBtn = document.getElementById('settings-toggle');
    if (!nestBtn || !settingsBtn) return;

    // Reset classes
    nestBtn.classList.remove('vibrant');

    if (window.autoProcess) {
        nestBtn.innerText = 'Auto';
        nestBtn.disabled = true;
    } else {
        const modeLabels = { '0': 'Minify!', '1': 'Beautify!', '2': 'Denest!', '3': 'Nest!' };
        nestBtn.innerText = modeLabels[settings['mode']] || 'Nest!';
        nestBtn.disabled = false;
        nestBtn.classList.add('vibrant');
    }
  }

  // Event Listeners

  // Font Dropdown
  document.querySelectorAll('#typefaces-listbox li').forEach(li => {
      li.addEventListener('click', () => {
          const fontMap = {
              "DejaVu Mono": "monospace",
              "Fira Code": "'Fira Code', monospace",
              "Jetbrains Mono": "'JetBrains Mono', monospace",
              "PT Mono": "'PT Mono', monospace"
          };
          const val = fontMap[li.textContent] || "'Fira Code', monospace";
          document.querySelector('#typefaces output').textContent = li.textContent;
          document.getElementById('typefaces-checkbox').checked = false;
          updateSetting('font', val);
      });
  });

  // Font Size Dropdown
  document.querySelectorAll('#fontsizes-listbox li').forEach(li => {
      li.addEventListener('click', () => {
          document.querySelector('#fontsizes output').textContent = li.textContent;
          document.getElementById('fontsizes-checkbox').checked = false;
          updateSetting('fontsize', li.textContent);
      });
  });

  // Indentation Type
  document.getElementById('indentation-type-checkbox').addEventListener('change', (e) => {
      updateSetting('indent-type', e.target.checked ? 'tab' : 'space');
  });

  // Indentation Size
  const indentInput = document.getElementById('indentation-size-input');
  indentInput.addEventListener('input', (e) => {
      updateSetting('indent-size', e.target.value);
  });
  document.getElementById('indent-up').addEventListener('click', () => {
      indentInput.value = parseInt(indentInput.value) + 1;
      updateSetting('indent-size', indentInput.value);
  });
  document.getElementById('indent-down').addEventListener('click', () => {
      indentInput.value = Math.max(1, parseInt(indentInput.value) - 1);
      updateSetting('indent-size', indentInput.value);
  });

  // Word Wrap
  document.getElementById('word-wrap-checkbox').addEventListener('change', (e) => {
      updateSetting('word-wrap', e.target.checked ? 'true' : 'false');
  });

  // Coordinates
  document.querySelectorAll('input[name="coordinates"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
          updateSetting('coords', e.target.value);
      });
  });

  // Comments
  document.getElementById('preserveComments-checkbox').addEventListener('change', (e) => {
      updateSetting('comments', e.target.checked ? 'false' : 'true');
  });

  // Mode
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
          updateSetting('mode', e.target.value);
      });
  });

  // Auto
  document.getElementById('auto-checkbox').addEventListener('change', (e) => {
      updateSetting('auto', e.target.checked ? 'true' : 'false');
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

      [window.inputEditor, window.outputEditor].forEach(editor => {
          editor.selection.on('changeCursor', () => {
              const tab = editor.container.parentElement.querySelector('.editorTab');
              const fileNameEl = tab?.querySelector('.fileName');
              if (fileNameEl && settings['coords'] !== '0') {
                  updateCoordText(editor, fileNameEl, parseInt(settings['coords']));
              }
          });
      });

      clearInterval(checkEditors);
    }
  }, 100);

})();
