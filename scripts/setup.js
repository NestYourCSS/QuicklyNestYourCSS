async function setupEditors() {
    // Wait for Ace and LanguageProvider
    await waitForVar('LanguageProvider');
    let provider = LanguageProvider.fromCdn("https://www.unpkg.com/ace-linters@1.2.3/build/");
      
    function initializeEditor(editorId, value) {
        const editor = window.ace.edit(editorId, {
            mode: "ace/mode/css",
            showPrintMargin: false,
            showGutter: true,
            highlightActiveLine: true,
            wrap: false,
            theme: "ace/theme/tomorrow_night_eighties" // Better default for dark UI
        });

        editor.setValue(value, -1);
        provider.registerEditor(editor);

        return editor;
    }

    // Load initial sample
    let sample = `
/* Selectors */
h1 {
    color: red;
}

.class-name {
    font-size: 16px;
}

#unique-id {
    background-color: blue;
}

#unique-id:hover {
    text-decoration: underline;
}

#unique-id :focus {
    border-color: green;
}

#unique-id ::first-line {
    font-weight: bold;
}

#unique-id::before {
    content: " ";
}
`;

    const inputEditor = initializeEditor("inputEditor", sample);
    const outputEditor = initializeEditor("outputEditor", '/* Your output CSS will appear here */');

    // Expose globally
    window.inputEditor = inputEditor;
    window.outputEditor = outputEditor;

    // Auto Nest logic
    let codeChanged = false;
    let isProcessing = false;

    inputEditor.getSession().on('change', () => {
        if (window.processAuto !== false) {
            codeChanged = true;
        }
    });

    inputEditor.getSession().on('changeAnnotation', () => {
        if ((window.processAuto !== false) && !isProcessing) {
            isProcessing = true;

            setTimeout(() => {
                if (codeChanged) {
                    if (typeof nestCode === 'function') nestCode();
                    codeChanged = false;
                }
                isProcessing = false;
            }, 500); // Throttled auto-nest
        }
    });

    // Initial Nest
    setTimeout(() => {
        if (typeof nestCode === 'function') nestCode();
    }, 1000); // Give it more time

    // Update coordinates on selection change
    [inputEditor, outputEditor].forEach(editor => {
        editor.selection.on('changeCursor', () => {
            if (typeof updateCoordinateDisplay === 'function') {
                updateCoordinateDisplay();
            }
        });
    });

    // Attach listeners to static buttons in the headers
    document.querySelectorAll('.editorWrapper').forEach((wrap, index) => {
        const editor = index === 0 ? inputEditor : outputEditor;
        const copyBtn = wrap.querySelector('.tabCopyAll');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(editor.getValue());
            });
        }
    });
}

// Global waitForVar helper (if not already in main.js)
if (typeof waitForVar !== 'function') {
    window.waitForVar = function(varName) {
        return new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (typeof window[varName] !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    };
}

setupEditors();
