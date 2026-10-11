// Keep the native textarea for mobile keyboards, accessibility and browser undo.
// The read-only overlay adds Python highlighting without executing user text.
export function mountEditor(editor) {
  const surface = editor.closest('.code-surface');
  const paint = surface.querySelector('.code-paint');
  const gutter = surface.querySelector('.code-lines');
  const tokens = /("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|#[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\b(?:def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|with|try|except|finally|raise|assert|pass|break|continue|lambda|yield|async|await|global|nonlocal|del)\b|\b\d+(?:\.\d*)?(?:[eE][+-]?\d+)?\b)/g;
  const syncScroll = () => {
    paint.style.transform = `translate(${-editor.scrollLeft}px, ${-editor.scrollTop}px)`;
    gutter.style.transform = `translateY(${-editor.scrollTop}px)`;
  };
  function refresh() {
    const text = editor.value;
    const fragment = document.createDocumentFragment();
    let end = 0;
    for (const match of text.matchAll(tokens)) {
      fragment.append(document.createTextNode(text.slice(end, match.index)));
      const token = document.createElement('span'); token.textContent = match[0];
      token.className = match[0][0] === '#' ? 'py-comment' : /^["']/.test(match[0]) ? 'py-string' : /^\d/.test(match[0]) ? 'py-number' : 'py-keyword';
      fragment.append(token); end = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(end) + '\n'));
    paint.replaceChildren(fragment);
    gutter.textContent = Array.from({ length: text.split('\n').length }, (_, i) => i + 1).join('\n');
    syncScroll();
  }
  function insert(text, start = editor.selectionStart, end = editor.selectionEnd) {
    editor.focus(); editor.setSelectionRange(start, end);
    // insertText preserves the native undo stack in Chromium and Firefox.
    if (!document.execCommand('insertText', false, text)) {
      editor.setRangeText(text, start, end, 'end');
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  editor.addEventListener('keydown', event => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    const start = editor.selectionStart, end = editor.selectionEnd;
    if (event.key === 'Tab') {
      event.preventDefault();
      if (start === end && !event.shiftKey) { insert('    '); return; }
      const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
      const selected = editor.value.slice(lineStart, end);
      const indented = selected.split('\n').map(line => event.shiftKey ? line.replace(/^(?: {1,4}|\t)/, '') : '    ' + line).join('\n');
      insert(indented, lineStart, end);
      editor.setSelectionRange(lineStart, lineStart + indented.length);
    } else if (event.key === 'Enter' && start === end) {
      event.preventDefault();
      const line = editor.value.slice(0, start).split('\n').at(-1);
      const indentation = line.match(/^\s*/)[0];
      const extra = /[:([{]\s*(?:#.*)?$/.test(line) ? '    ' : '';
      insert('\n' + indentation + extra);
    }
  });
  editor.addEventListener('input', refresh);
  editor.addEventListener('scroll', syncScroll);
  surface.classList.add('highlight-ready');
  refresh();
  return { refresh };
}
