(function() {
    const settings = ['preserveComments', 'mode', 'auto', 'typefaces', 'fontsizes', 'indentationType', 'indentationSize', 'wordWrap', 'coordinates'];

    function isAceEditor(obj) {
        return obj && typeof obj.setOption === 'function' && typeof obj.getSession === 'function';
    }

    function updateCoordinateDisplay() {
        if (!isAceEditor(window.inputEditor) || !isAceEditor(window.outputEditor)) return;

        const val = parseInt(localStorage.getItem('coordinates')) || 0;
        const inputPos = window.inputEditor.getCursorPosition();
        const outputPos = window.outputEditor.getCursorPosition();

        const format = (pos) => {
            if (val === 1) return ` Ln ${pos.row + 1}`;
            if (val === 2) return ` Col ${pos.column + 1}`;
            if (val === 3) return ` Ln ${pos.row + 1}, Col ${pos.column + 1}`;
            return '';
        };

        const inputCoord = document.getElementById('inputCoordinates');
        const outputCoord = document.getElementById('outputCoordinates');

        if (inputCoord) inputCoord.textContent = format(inputPos);
        if (outputCoord) outputCoord.textContent = format(outputPos);
    }

    function applySetting(id, value) {
        const elem = document.getElementById(id);
        if (!elem) return;

        // Visual update
        if (elem.classList.contains('checkbox')) {
            const checkbox = elem.querySelector('input[type="checkbox"]');
            if (checkbox) checkbox.checked = (value === 'true' || value === true);
        } else if (elem.classList.contains('radio-group')) {
            const radioButtons = elem.querySelectorAll('input[type="radio"]');
            if (radioButtons[value]) radioButtons[value].checked = true;
        } else if (elem.classList.contains('number')) {
            const input = elem.querySelector('input');
            if (input) input.value = value;
        } else if (elem.tagName === 'SELECT' || elem.classList.contains('custom-select')) {
            elem.value = value;
        }

        // Functional update
        const inputEditor = window.inputEditor;
        const outputEditor = window.outputEditor;

        switch (id) {
            case 'preserveComments':
                window.preserveComments = (value === 'true' || value === true);
                break;
            case 'mode':
                window.processMode = parseInt(value);
                break;
            case 'auto':
                window.processAuto = (value === 'true' || value === true);
                break;
            case 'typefaces':
                if (isAceEditor(inputEditor)) inputEditor.setOption('fontFamily', value);
                if (isAceEditor(outputEditor)) outputEditor.setOption('fontFamily', value);
                break;
            case 'fontsizes':
                if (isAceEditor(inputEditor)) inputEditor.setOption('fontSize', value);
                if (isAceEditor(outputEditor)) outputEditor.setOption('fontSize', value);
                break;
            case 'indentationType':
                const useSoft = (value === 'false' || value === false); // Hard = checked = true
                if (isAceEditor(inputEditor)) inputEditor.getSession().setUseSoftTabs(useSoft);
                if (isAceEditor(outputEditor)) outputEditor.getSession().setUseSoftTabs(useSoft);
                break;
            case 'indentationSize':
                const size = parseInt(value);
                if (isAceEditor(inputEditor)) inputEditor.getSession().setTabSize(size);
                if (isAceEditor(outputEditor)) outputEditor.getSession().setTabSize(size);
                break;
            case 'wordWrap':
                const wrap = (value === 'true' || value === true);
                if (isAceEditor(inputEditor)) inputEditor.setOption('wrap', wrap);
                if (isAceEditor(outputEditor)) outputEditor.setOption('wrap', wrap);
                break;
            case 'coordinates':
                updateCoordinateDisplay();
                break;
        }
    }

    function updateAndCommit(id, value) {
        localStorage.setItem(id, value);
        applySetting(id, value);
    }

    window.updateCoordinateDisplay = updateCoordinateDisplay;

    function initSettings() {
        settings.forEach(id => {
            const value = localStorage.getItem(id);
            if (value !== null) {
                applySetting(id, value);
            }
        });

        // Event Listeners
        document.querySelectorAll('.checkbox input').forEach(input => {
            input.addEventListener('change', () => {
                const labelGroup = input.closest('.checkbox');
                updateAndCommit(labelGroup.id, input.checked);
            });
        });

        document.querySelectorAll('.radio-group input').forEach(input => {
            input.addEventListener('change', () => {
                const group = input.closest('.radio-group');
                const index = Array.from(group.querySelectorAll('input[type="radio"]')).indexOf(input);
                updateAndCommit(group.id, index);
            });
        });

        document.querySelectorAll('select.custom-select').forEach(select => {
            select.addEventListener('change', () => {
                updateAndCommit(select.id, select.value);
            });
        });

        document.querySelectorAll('.number').forEach(stepper => {
            const input = stepper.querySelector('input');
            const up = stepper.querySelector('.up');
            const down = stepper.querySelector('.down');

            const change = (delta) => {
                let val = parseInt(input.value) + delta;
                if (val < 1) val = 1;
                if (val > 32) val = 32;
                updateAndCommit(stepper.id, val);
            };

            up.addEventListener('click', (e) => { e.preventDefault(); change(1); });
            down.addEventListener('click', (e) => { e.preventDefault(); change(-1); });
        });

        updateCoordinateDisplay();
    }

    window.addEventListener('load', initSettings);
})();
