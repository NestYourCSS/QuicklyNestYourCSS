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
            defaultValue: true,
            action: (value) => {
                if (typeof inputEditor === 'undefined' || typeof outputEditor === 'undefined') return;
                inputEditor.getSession().setUseSoftTabs(value);
                outputEditor.getSession().setUseSoftTabs(value);
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
            defaultValue: 'false',
            action: (value) => {
                if (typeof inputEditor === 'undefined' || typeof outputEditor === 'undefined') return;
                const show = value === 'true';
                inputEditor.setOption('showGutter', show);
                inputEditor.setOption('showLineNumbers', show);
                outputEditor.setOption('showGutter', show);
                outputEditor.setOption('showLineNumbers', show);
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
            'var(--red-colour-medium)',
            'var(--sec-colour-medium)',
            'var(--pri-colour-medium)',
            'var(--sec-colour-lighter)'
        ];

        const mode = window.processMode ?? 3;
        nestBtn.textContent = modeNames[mode];

        if (window.processAuto) {
            nestBtn.disabled = true;
            nestBtn.style.background = 'var(--shades-darker)';
        } else {
            nestBtn.disabled = false;
            nestBtn.style.background = modeColors[mode];
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
            handleSettingChange(e.target.id, e.target.value);
        }
    });

    // Initialize
    window.waitForVar('inputEditor').then(() => {
        loadSettings();
        // Initial actions
        for (const key in settings) {
            if (settingsConfig[key].action) {
                settingsConfig[key].action(settings[key]);
            }
        }
    });
});
