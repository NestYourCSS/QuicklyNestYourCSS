(function() {
  const toggleBtn = document.getElementById('settings-toggle');
  const popover = document.getElementById('settings-popover');

  toggleBtn.addEventListener('click', (e) => {
    popover.classList.toggle('hidden');
    e.stopPropagation();
  });

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== toggleBtn) {
      popover.classList.add('hidden');
    }
  });

  // Functionality
  const modeSelect = document.getElementById('setting-mode');
  const commentsCheckbox = document.getElementById('setting-comments');

  modeSelect.addEventListener('change', () => {
    window.processMode = parseInt(modeSelect.value);
    if (window.nestCode) window.nestCode();
  });

  commentsCheckbox.addEventListener('change', () => {
    window.preserveComments = commentsCheckbox.checked;
    if (window.nestCode) window.nestCode();
  });

  // Editor
  const fontSelect = document.getElementById('setting-font');
  const sizeInput = document.getElementById('setting-size');
  const indentSelect = document.getElementById('setting-indent');
  const wrapCheckbox = document.getElementById('setting-wrap');
  const coordsCheckbox = document.getElementById('setting-coords');

  function updateEditors() {
    const editors = [window.inputEditor, window.outputEditor];
    const fontSize = parseInt(sizeInput.value) || 16;
    const fontFamily = fontSelect.value;
    const useWrapMode = wrapCheckbox.checked;
    const showGutter = coordsCheckbox.checked;
    const indentChar = indentSelect.value;
    const tabSize = indentChar === '\t' ? 4 : indentChar.length;
    const useSoftTabs = indentChar !== '\t';

    window.editorIndentChar = indentChar;

    editors.forEach(editor => {
      if (!editor) return;

      editor.setOptions({
        fontFamily: fontFamily,
        fontSize: fontSize + "px"
      });

      editor.getSession().setUseWrapMode(useWrapMode);
      editor.renderer.setShowGutter(showGutter);
      editor.getSession().setTabSize(tabSize);
      editor.getSession().setUseSoftTabs(useSoftTabs);
    });

    if (window.nestCode) window.nestCode();
  }

  fontSelect.addEventListener('change', updateEditors);
  sizeInput.addEventListener('input', updateEditors);
  indentSelect.addEventListener('change', updateEditors);
  wrapCheckbox.addEventListener('change', updateEditors);
  coordsCheckbox.addEventListener('change', updateEditors);

  // Initialize after editors are ready
  const checkEditors = setInterval(() => {
    if (window.inputEditor && window.outputEditor) {
      updateEditors();
      clearInterval(checkEditors);
    }
  }, 100);
})();
