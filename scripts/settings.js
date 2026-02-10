document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('settingsBtn');
    const nestBtn = document.getElementById('nestBtn');
    const settingsPopover = document.getElementById('settingsPopover');

    const settingsConfig = {
        mode: {
            defaultValue: '3',
            action: (value) => {
                window.processMode = parseInt(value);
                updateNestButton();
                if (window.processAuto && typeof nestCode === 'function') {
                    nestCode();
                }
            }
        },
        auto: {
            defaultValue: true,
            action: (value) => {
                window.processAuto = value;
                updateNestButton();
                if (window.processAuto && typeof nestCode === 'function') {
                    nestCode();
                }
            }
        },
        preserveComments: {
            defaultValue: true,
            action: (value) => {
                window.preserveComments = value;
                if (window.processAuto && typeof nestCode === 'function') {
                    nestCode();
                }
            }
        },
        typefaces: {
            defaultValue: 'Fira Code',
            action: (value) => {
                if (typeof inputEditor === 'undefined' || typeof outputEditor === 'undefined') return;
                const fontFamily = `"${value}", monospace`;
                inputEditor.container.style.fontFamily = fontFamily;
                outputEditor.container.style.fontFamily = fontFamily;
                inputEditor.renderer.updateFull();
                outputEditor.renderer.updateFull();
            }
        },
        fontsizes: {
            defaultValue: '1.1rem',
            action: (value) => {
                if (typeof inputEditor === 'undefined' || typeof outputEditor === 'undefined') return;
                inputEditor.container.style.fontSize = value;
                outputEditor.container.style.fontSize = value;
                inputEditor.renderer.updateFull();
                outputEditor.renderer.updateFull();
            }
        },
        indentationType: {
            defaultValue: 'soft',
            action: (value) => {
                if (typeof inputEditor === 'undefined' || typeof outputEditor === 'undefined') return;
                const useSoft = value === 'soft';
                inputEditor.getSession().setUseSoftTabs(useSoft);
                outputEditor.getSession().setUseSoftTabs(useSoft);
                updateIndentChar();
            }
        },
        indentationSize: {
            defaultValue: 4,
            action: (value) => {
                if (typeof inputEditor === 'undefined' || typeof outputEditor === 'undefined') return;
                const size = parseInt(value);
                inputEditor.getSession().setTabSize(size);
                outputEditor.getSession().setTabSize(size);
                updateIndentChar();
            }
        },
        wordWrap: {
            defaultValue: false,
            action: (value) => {
                if (typeof inputEditor === 'undefined' || typeof outputEditor === 'undefined') return;
                inputEditor.getSession().setUseWrapMode(value);
                outputEditor.getSession().setUseWrapMode(value);
            }
        },
        coordinates: {
            defaultValue: 'none',
            action: (value) => {
                window.showCoordinates = value;
                updateCoordinateDisplays();
            }
        }
    };

    const settings = {};
    const STORAGE_KEY = 'quicklySettings';

    function loadSettings() {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        for (const key in settingsConfig) {
            settings[key] = saved[key] !== undefined ? saved[key] : settingsConfig[key].defaultValue;
            applyUIState(key, settings[key]);
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    function applyUIState(id, value) {
        const radios = document.getElementsByName(id);
        if (radios.length > 0) {
            radios.forEach(r => {
                if (String(r.value) === String(value)) r.checked = true;
            });
            return;
        }

        const elem = document.getElementById(id);
        if (!elem) return;

        if (elem.type === 'checkbox') {
            elem.checked = value;
        } else if (elem.tagName === 'SELECT' || elem.type === 'number') {
            elem.value = value;
        }
    }

    function updateNestButton() {
        if (!nestBtn) return;

        const modeNames = ['Minify!', 'Beautify!', 'Denest!', 'Nest!'];
        const modeColors = [
            { start: 'var(--red-colour-medium)', end: 'var(--red-colour-m-darker)', glow: 'var(--red-colour-medium)' },
            { start: 'var(--sec-colour-medium)', end: 'var(--sec-colour-m-darker)', glow: 'var(--sec-colour-medium)' },
            { start: 'var(--pri-colour-medium)', end: 'var(--pri-colour-m-darker)', glow: 'var(--pri-colour-medium)' },
            { start: 'var(--sec-colour-lighter)', end: 'var(--sec-colour-medium)', glow: 'var(--sec-colour-lighter)' }
        ];

        const mode = window.processMode ?? 3;
        nestBtn.textContent = modeNames[mode];

        if (window.processAuto) {
            nestBtn.disabled = true;
            nestBtn.style.setProperty('--btn-bg', 'var(--shades-m-darker)');
            nestBtn.style.setProperty('--btn-glow', 'transparent');
        } else {
            const colors = modeColors[mode];
            nestBtn.disabled = false;
            nestBtn.style.setProperty('--btn-bg', `linear-gradient(135deg, ${colors.start}, ${colors.end})`);
            nestBtn.style.setProperty('--btn-glow', colors.glow);
        }
    }

    function updateIndentChar() {
        if (typeof inputEditor === 'undefined') return;
        const useSoftTabs = inputEditor.getSession().getUseSoftTabs();
        const tabSize = inputEditor.getSession().getTabSize();
        window.editorIndentChar = useSoftTabs ? ' '.repeat(tabSize) : '\t';
        if (window.processAuto && typeof nestCode === 'function') {
            nestCode();
        }
    }

    function updateCoordinateDisplays() {
        const mode = window.showCoordinates || 'none';
        const inputCoords = document.querySelector('#inputEditor').parentElement.querySelector('.editorCoordinates');
        const outputCoords = document.querySelector('#outputEditor').parentElement.querySelector('.editorCoordinates');

        const updateDisplay = (display, editor) => {
            if (!display || !editor) return;
            if (mode === 'none') {
                display.style.display = 'none';
                return;
            }
            display.style.display = 'block';
            const pos = editor.getCursorPosition();
            const ln = pos.row + 1;
            const col = pos.column + 1;

            if (mode === 'line') display.textContent = `Ln ${ln}`;
            else if (mode === 'col') display.textContent = `Col ${col}`;
            else if (mode === 'both') display.textContent = `Ln ${ln}, Col ${col}`;
        };

        updateDisplay(inputCoords, window.inputEditor);
        updateDisplay(outputCoords, window.outputEditor);
    }

    function adjustInputWidth(input) {
        if (!input) return;
        const value = input.value || "";
        input.style.width = (value.length + 2) + "ch";
    }

    function handleSettingChange(id, value) {
        settings[id] = value;
        if (settingsConfig[id].action) {
            settingsConfig[id].action(value);
        }
        saveSettings();
    }

    // Event Listeners
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPopover.hidden = !settingsPopover.hidden;
    });

    document.addEventListener('click', (e) => {
        if (!settingsPopover.contains(e.target) && e.target !== settingsBtn) {
            settingsPopover.hidden = true;
        }
    });

    settingsPopover.addEventListener('change', (e) => {
        const target = e.target;
        const id = target.name || target.id;
        let value = target.value;
        if (target.type === 'checkbox') {
            value = target.checked;
        }
        handleSettingChange(id, value);
    });

    settingsPopover.addEventListener('input', (e) => {
        if (e.target.type === 'number') {
            adjustInputWidth(e.target);
            handleSettingChange(e.target.id, e.target.value);
        }
    });

    // Initialize
    window.waitForVar('inputEditor').then(() => {
        loadSettings();

        // Cursor listeners for coordinates
        inputEditor.selection.on('changeCursor', updateCoordinateDisplays);
        outputEditor.selection.on('changeCursor', updateCoordinateDisplays);

        // Initial actions
        for (const key in settings) {
            if (settingsConfig[key].action) {
                settingsConfig[key].action(settings[key]);
            }
        }

        // Adjust width for number inputs initially
        const numberInputs = settingsPopover.querySelectorAll('input[type="number"]');
        numberInputs.forEach(adjustInputWidth);
    });
});
