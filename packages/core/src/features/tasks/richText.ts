/**
 * The description editor's page: one HTML document containing the toolbar, a
 * contenteditable area, and the Markdown <-> HTML conversion.
 *
 * Both clients render this same document, so the two editors cannot drift:
 *   mobile — inside a WebView (a native toolbar outside it steals the touch,
 *            which drops the selection before the command runs)
 *   web    — inside an <iframe>, for the same reason the mobile one exists:
 *            the caret and selection must stay inside the document that owns them
 *
 * It is a *string*, not DOM code executed here, so it does not break the
 * "no DOM in core" rule — the apps are what put it in front of an engine.
 *
 * The description is stored as Markdown either way, so a task written on the
 * phone reads correctly on the web and back.
 *
 * The page talks to its host with postMessage and exposes `window.editor`
 * ({ setMarkdown, focusEnd, blur }) for the host to call.
 */

/** The toolbar's height, which the hosts add to their own minimum heights. */
export const TOOLBAR_HEIGHT = 45;

export interface EditorPageOptions {
  background: string;
  fill: boolean;
  text: string;
  secondary: string;
  faint: string;
  border: string;
  accent: string;
  accentMuted: string;
  placeholder: string;
  minHeight: number;
}

const escapeAttr = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const LIST_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.3" fill="currentColor"/><circle cx="4" cy="12" r="1.3" fill="currentColor"/><circle cx="4" cy="18" r="1.3" fill="currentColor"/></svg>';

const CHECK_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><polyline points="7.5 12.5 10.5 15.5 16.5 9"/></svg>';

export function buildEditorHtml(o: EditorPageOptions) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    color: ${o.text};
    font: 15px/1.45 -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-tap-highlight-color: transparent;
    -webkit-text-size-adjust: 100%;
  }
  #toolbar {
    ${o.fill ? `position: sticky; top: 0; z-index: 2; background: ${o.background};` : ''}
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    height: ${TOOLBAR_HEIGHT}px;
    padding: 0 6px;
    border-bottom: 1px solid ${o.border};
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  .tool {
    flex: 1 1 0;
    max-width: 46px;
    height: 36px;
    margin: 0 1px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${o.secondary};
    font-size: 14px;
    font-weight: 700;
  }
  .tool.on { color: ${o.accent}; background: ${o.accentMuted}; }
  .tool.pressed { background: ${o.accentMuted}; }
  #editor {
    position: relative;
    box-sizing: border-box;
    min-height: ${o.fill ? `calc(100vh - ${TOOLBAR_HEIGHT}px)` : `${o.minHeight}px`};
    padding: ${o.fill ? '16px 18px 48px' : '12px 14px 16px'};
    outline: none;
    white-space: pre-wrap;
    word-wrap: break-word;
    caret-color: ${o.accent};
  }
  #editor.empty::before {
    content: attr(data-placeholder);
    color: ${o.faint};
    position: absolute;
    pointer-events: none;
  }
  h1 { font-size: 22px; line-height: 1.3; margin: 6px 0; font-weight: 700; }
  h2 { font-size: 18px; line-height: 1.3; margin: 6px 0; font-weight: 700; }
  code {
    font-family: Menlo, Consolas, monospace;
    font-size: 13px;
    background: ${o.accentMuted};
    color: ${o.accent};
    border-radius: 4px;
    padding: 1px 4px;
  }
  ul { margin: 2px 0; padding-left: 22px; }
  ul.check { list-style: none; padding-left: 0; }
  ul.check > li { position: relative; padding-left: 28px; margin: 3px 0; }
  ul.check > li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 2px;
    width: 16px;
    height: 16px;
    border: 2px solid ${o.faint};
    border-radius: 5px;
  }
  ul.check > li.checked { color: ${o.faint}; text-decoration: line-through; }
  ul.check > li.checked::before {
    content: "\\2713";
    background: ${o.accent};
    border-color: ${o.accent};
    color: #fff;
    font-size: 12px;
    line-height: 16px;
    text-align: center;
    text-decoration: none;
  }
</style>
</head>
<body>
<div id="root">
  <div id="toolbar">
    <div class="tool" data-cmd="bold" style="font-weight:900">B</div>
    <div class="tool" data-cmd="italic" style="font-style:italic;font-family:Georgia,serif">I</div>
    <div class="tool" data-cmd="strike" style="text-decoration:line-through">S</div>
    <div class="tool" data-cmd="code" style="font-size:13px">&lt;/&gt;</div>
    <div class="tool" data-cmd="h1">H1</div>
    <div class="tool" data-cmd="h2">H2</div>
    <div class="tool" data-cmd="bullet">${LIST_ICON}</div>
    <div class="tool" data-cmd="check">${CHECK_ICON}</div>
  </div>
  <div id="editor" contenteditable="true" data-placeholder="${escapeAttr(o.placeholder)}"></div>
</div>
<script>${EDITOR_SCRIPT}</script>
</body>
</html>`;
}

// String.raw keeps the regex backslashes intact. No backticks or "${" in here.
const EDITOR_SCRIPT = String.raw`
(function () {
  var root = document.getElementById('root');
  var ed = document.getElementById('editor');
  var bar = document.getElementById('toolbar');
  var BT = String.fromCharCode(96);
  // Built from char codes: Metro turns escape sequences in this template into raw
  // characters, and the HTML parser rewrites some raw characters inside <script>.
  var ZW = String.fromCharCode(0x200b);
  var NBSP = String.fromCharCode(0xa0);
  var HOLE = String.fromCharCode(0xe000);
  var ZW_ALL = new RegExp(ZW, 'g');
  var saved = null;
  var lastMd = null;
  var lastHeight = 0;

  document.execCommand('defaultParagraphSeparator', false, 'div');
  document.execCommand('styleWithCSS', false, false);

  // Mobile hands messages to the WebView bridge; on web the page is an iframe,
  // so they go to the parent window instead.
  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    else if (window.parent !== window) window.parent.postMessage(JSON.stringify(msg), '*');
  }

  /* ---------- Markdown -> HTML ---------- */

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inlineToHtml(s) {
    var codes = [];
    s = esc(s);
    s = s.replace(new RegExp(BT + '([^' + BT + ']+)' + BT, 'g'), function (_, c) {
      codes.push(c);
      return HOLE + (codes.length - 1) + HOLE;
    });
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/~~(.+?)~~/g, '<s>$1</s>');
    s = s.replace(/(^|[^A-Za-z0-9_])_(?!\s)(.+?)_(?![A-Za-z0-9_])/g, '$1<i>$2</i>');
    s = s.replace(new RegExp(HOLE + '([0-9]+)' + HOLE, 'g'), function (_, i) { return '<code>' + codes[+i] + '</code>'; });
    return s || '<br>';
  }

  function mdToHtml(md) {
    var out = [];
    var list = null;
    function closeList() { if (list) { out.push('</ul>'); list = null; } }

    md.replace(/\r\n?/g, '\n').split('\n').forEach(function (line) {
      var m;
      if ((m = /^- \[( |x|X)\] ?(.*)$/.exec(line))) {
        if (list !== 'check') { closeList(); out.push('<ul class="check">'); list = 'check'; }
        out.push('<li' + (m[1] === ' ' ? '' : ' class="checked"') + '>' + inlineToHtml(m[2]) + '</li>');
      } else if ((m = /^[-*] (.*)$/.exec(line))) {
        if (list !== 'bullet') { closeList(); out.push('<ul>'); list = 'bullet'; }
        out.push('<li>' + inlineToHtml(m[1]) + '</li>');
      } else {
        closeList();
        if ((m = /^## (.*)$/.exec(line))) out.push('<h2>' + inlineToHtml(m[1]) + '</h2>');
        else if ((m = /^# (.*)$/.exec(line))) out.push('<h1>' + inlineToHtml(m[1]) + '</h1>');
        else out.push('<div>' + inlineToHtml(line) + '</div>');
      }
    });
    closeList();
    return out.join('');
  }

  /* ---------- HTML -> Markdown ---------- */

  var BLOCK = { DIV: 1, P: 1, H1: 1, H2: 1, H3: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, PRE: 1 };

  function wrapMark(inner, mark) {
    // Markdown markers must hug the words: "** bold**" is not bold.
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner);
    return m[2] ? m[1] + mark + m[2] + mark + m[3] : inner;
  }

  function inlineOf(node) {
    var s = '';
    for (var i = 0; i < node.childNodes.length; i++) s += inlineMd(node.childNodes[i]);
    return s;
  }

  function inlineMd(n) {
    if (n.nodeType === 3) return n.nodeValue.replace(ZW_ALL, '').split(NBSP).join(' ');
    if (n.nodeType !== 1) return '';
    var t = n.tagName;
    var st = n.style || {};
    if (t === 'BR') return '\n';
    if (t === 'CODE') {
      var c = n.textContent.replace(ZW_ALL, '');
      return c ? BT + c + BT : '';
    }
    var inner = inlineOf(n);
    var weight = st.fontWeight;
    if (t === 'B' || t === 'STRONG' || weight === 'bold' || +weight >= 600) inner = wrapMark(inner, '**');
    if (t === 'I' || t === 'EM' || st.fontStyle === 'italic') inner = wrapMark(inner, '_');
    var deco = (st.textDecoration || '') + ' ' + (st.textDecorationLine || '');
    if (t === 'S' || t === 'STRIKE' || t === 'DEL' || deco.indexOf('line-through') >= 0) inner = wrapMark(inner, '~~');
    return inner;
  }

  function oneLine(s) { return s.replace(/\n$/, '').replace(/\n/g, ' '); }

  function toLines(container, lines) {
    var buf = null;
    function flush() {
      if (buf !== null) { lines.push(buf.replace(/\n$/, '')); buf = null; }
    }
    for (var i = 0; i < container.childNodes.length; i++) {
      var n = container.childNodes[i];
      if (n.nodeType !== 1 || !BLOCK[n.tagName]) {
        buf = (buf === null ? '' : buf) + inlineMd(n);
        continue;
      }
      flush();
      var t = n.tagName;
      if (t === 'UL' || t === 'OL') {
        var check = n.classList.contains('check');
        for (var j = 0; j < n.children.length; j++) {
          var li = n.children[j];
          var text = '';
          var nested = [];
          for (var k = 0; k < li.childNodes.length; k++) {
            var c = li.childNodes[k];
            if (c.nodeType === 1 && (c.tagName === 'UL' || c.tagName === 'OL')) nested.push(c);
            else text += inlineMd(c);
          }
          var prefix = check ? (li.classList.contains('checked') ? '- [x] ' : '- [ ] ') : '- ';
          lines.push(prefix + oneLine(text));
          nested.forEach(function (u) {
            var holder = document.createElement('div');
            holder.appendChild(u.cloneNode(true));
            toLines(holder, lines);
          });
        }
      } else if (t === 'H1' || t === 'H2' || t === 'H3') {
        lines.push((t === 'H1' ? '# ' : '## ') + oneLine(inlineOf(n)));
      } else if (!n.childNodes.length) {
        lines.push('');
      } else {
        toLines(n, lines);
      }
    }
    flush();
  }

  function htmlToMd() {
    var lines = [];
    toLines(ed, lines);
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    return lines.join('\n');
  }

  /* ---------- Selection helpers ---------- */

  function inEditor(node) { return !!node && (node === ed || ed.contains(node)); }

  function closest(tags) {
    var sel = window.getSelection();
    if (!sel.rangeCount || !inEditor(sel.anchorNode)) return null;
    var n = sel.anchorNode;
    while (n && n !== ed) {
      if (n.nodeType === 1 && tags.indexOf(n.tagName) >= 0) return n;
      n = n.parentNode;
    }
    return null;
  }

  function placeCaret(range) {
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Only needed when a button is tapped before the editor was ever focused, or
  // after the keyboard was closed: put the caret back where it last was.
  function ensureSelection() {
    var sel = window.getSelection();
    if (document.activeElement === ed && sel.rangeCount && inEditor(sel.anchorNode)) return;
    ed.focus();
    placeCaret(saved || endOfText());
  }

  // The end of the last line's text — not the end of the editor itself, which
  // sits after the last <div> and would start a new line.
  function endOfText() {
    var node = ed;
    while (node.lastChild && !(node.lastChild.nodeType === 1 && node.lastChild.tagName === 'BR')) {
      node = node.lastChild;
    }
    var range = document.createRange();
    if (node.nodeType === 3) range.setStart(node, node.nodeValue.length);
    else if (node.lastChild) range.setStartBefore(node.lastChild); // an empty line's <br>
    else range.setStart(node, 0);
    range.collapse(true);
    return range;
  }

  /* ---------- Commands ---------- */

  var INLINE_TAGS = {
    bold: ['B', 'STRONG'],
    italic: ['I', 'EM'],
    strike: ['S', 'STRIKE', 'DEL'],
    code: ['CODE'],
  };
  var NEW_TAG = { bold: 'b', italic: 'i', strike: 's', code: 'code' };
  var COMMAND = { bold: 'bold', italic: 'italic', strike: 'strikeThrough' };

  function caretAt(node, offset) {
    var r = document.createRange();
    r.setStart(node, offset);
    r.collapse(true);
    placeCaret(r);
  }

  // With nothing selected, execCommand('bold') only sets a pending "typing
  // style". Android keyboards keep the word being typed as a composition and
  // rewrite it, which throws that style away — so on a phone the button did
  // nothing. Instead, put a real <b> at the caret and type inside it.
  function enterInline(kind, range) {
    var el = document.createElement(NEW_TAG[kind]);
    el.appendChild(document.createTextNode(ZW)); // somewhere for the caret to sit
    range.insertNode(el);
    caretAt(el.firstChild, 1);
  }

  // Leaving bold at the caret: whatever follows the caret keeps the formatting,
  // and typing continues in a plain text node placed after the element.
  function exitInline(el, range) {
    var tail = document.createRange();
    tail.setStart(range.startContainer, range.startOffset);
    tail.setEnd(el, el.childNodes.length);
    var rest = tail.extractContents();

    var plain = document.createTextNode(ZW);
    el.parentNode.insertBefore(plain, el.nextSibling);
    if (rest.textContent.replace(ZW_ALL, '')) {
      var clone = el.cloneNode(false);
      clone.appendChild(rest);
      el.parentNode.insertBefore(clone, plain.nextSibling);
    }
    if (!el.textContent.replace(ZW_ALL, '')) el.parentNode.removeChild(el);
    caretAt(plain, 1);
  }

  function unwrap(el) {
    var parent = el.parentNode;
    var first = el.firstChild;
    var last = el.lastChild;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    if (first && last) {
      var r = document.createRange();
      r.setStartBefore(first);
      r.setEndAfter(last);
      placeCaret(r);
    }
  }

  function toggleInline(kind) {
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var range = sel.getRangeAt(0);
    var current = closest(INLINE_TAGS[kind]);

    if (range.collapsed) {
      if (current) exitInline(current, range);
      else enterInline(kind, range);
      return;
    }

    if (kind !== 'code') {
      document.execCommand(COMMAND[kind]);
    } else if (current) {
      unwrap(current);
    } else {
      var el = document.createElement('code');
      el.appendChild(range.extractContents());
      range.insertNode(el);
      var all = document.createRange();
      all.selectNodeContents(el);
      placeCaret(all);
    }
  }

  function toggleList(kind) {
    var list = closest(['UL', 'OL']);
    var isCheck = !!list && list.classList.contains('check');
    if (list && (kind === 'check') === isCheck) {
      document.execCommand('insertUnorderedList'); // same kind again: remove the list
    } else if (list) {
      list.classList.toggle('check', kind === 'check'); // bullet <-> checkbox
    } else {
      document.execCommand('insertUnorderedList');
      var made = closest(['UL']);
      if (made && kind === 'check') made.classList.add('check');
    }
  }

  // Android keyboards keep the word being typed "open" (underlined) until a
  // space. If a button is tapped mid-word, the keyboard's next letter replaces
  // that open word — wiping out whatever the button just built. Moving focus
  // out and back makes the browser commit the word first.
  var composing = false;
  ed.addEventListener('compositionstart', function () { composing = true; });
  ed.addEventListener('compositionend', function () { composing = false; });

  function commitComposition() {
    if (!composing) return;
    var sel = window.getSelection();
    var range = sel.rangeCount && inEditor(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
    ed.blur();
    ed.focus();
    if (range) placeCaret(range);
    composing = false;
  }

  function exec(cmd) {
    commitComposition();
    ensureSelection();
    switch (cmd) {
      case 'bold':
      case 'italic':
      case 'strike':
      case 'code':
        toggleInline(cmd);
        break;
      case 'h1':
      case 'h2':
        var heading = closest(['H1', 'H2']);
        var same = heading && heading.tagName === cmd.toUpperCase();
        document.execCommand('formatBlock', false, same ? '<div>' : '<' + cmd + '>');
        break;
      case 'bullet':
      case 'check':
        toggleList(cmd);
        break;
    }
    changed();
  }

  /* ---------- Toolbar ---------- */

  var tools = bar.querySelectorAll('[data-cmd]');

  function refreshToolbar() {
    var focused = document.activeElement === ed;
    var list = closest(['UL', 'OL']);
    var heading = closest(['H1', 'H2']);
    // queryCommandState('bold') is true everywhere inside a heading, so it is
    // only trusted for a real selection outside headings.
    var sel = window.getSelection();
    var ranged = focused && !heading && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed;
    var active = {
      bold: !!closest(INLINE_TAGS.bold) || (ranged && document.queryCommandState('bold')),
      italic: !!closest(INLINE_TAGS.italic) || (ranged && document.queryCommandState('italic')),
      strike: !!closest(INLINE_TAGS.strike) || (ranged && document.queryCommandState('strikeThrough')),
      code: !!closest(INLINE_TAGS.code),
      h1: !!heading && heading.tagName === 'H1',
      h2: !!heading && heading.tagName === 'H2',
      bullet: !!list && !list.classList.contains('check'),
      check: !!list && list.classList.contains('check'),
    };
    for (var i = 0; i < tools.length; i++) {
      tools[i].classList.toggle('on', !!active[tools[i].getAttribute('data-cmd')]);
    }
  }

  // The toolbar must never take focus: that would drop the selection and close
  // the keyboard. Cancelling touchstart stops the tap from becoming a
  // mousedown/click (which is what moves focus); the command runs on touchend.
  var pressed = null;

  bar.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var tool = e.target.closest('[data-cmd]');
    if (!tool) return;
    pressed = tool;
    tool.classList.add('pressed');
  }, { passive: false });

  bar.addEventListener('touchend', function (e) {
    e.preventDefault();
    if (!pressed) return;
    var tool = pressed;
    pressed = null;
    tool.classList.remove('pressed');
    exec(tool.getAttribute('data-cmd'));
  }, { passive: false });

  bar.addEventListener('touchcancel', function () {
    if (pressed) pressed.classList.remove('pressed');
    pressed = null;
  });

  // Mouse fallback (desktop debugging).
  bar.addEventListener('mousedown', function (e) {
    e.preventDefault();
    var tool = e.target.closest('[data-cmd]');
    if (tool) exec(tool.getAttribute('data-cmd'));
  });

  /* ---------- Reporting back to React Native ---------- */

  function refreshEmpty() {
    var empty = !ed.textContent.replace(ZW_ALL, '').trim() && !ed.querySelector('li, h1, h2, code');
    ed.classList.toggle('empty', empty);
  }

  function sendHeight() {
    var h = Math.ceil(root.getBoundingClientRect().height);
    if (h !== lastHeight) { lastHeight = h; post({ type: 'height', height: h }); }
  }

  function changed() {
    refreshEmpty();
    var md = htmlToMd();
    if (md !== lastMd) { lastMd = md; post({ type: 'change', markdown: md }); }
    refreshToolbar();
    sendHeight();
  }

  ed.addEventListener('input', changed);
  ed.addEventListener('keyup', refreshToolbar);
  ed.addEventListener('blur', refreshToolbar);

  document.addEventListener('selectionchange', function () {
    var sel = window.getSelection();
    if (sel.rangeCount && inEditor(sel.anchorNode)) saved = sel.getRangeAt(0).cloneRange();
    refreshToolbar();
  });

  // Tapping a checkbox square ticks it instead of moving the caret.
  ed.addEventListener('click', function (e) {
    var li = e.target.closest ? e.target.closest('ul.check > li') : null;
    if (!li) return;
    if (e.clientX - li.getBoundingClientRect().left < 26) {
      e.preventDefault();
      li.classList.toggle('checked');
      changed();
    }
  });

  if (window.ResizeObserver) new ResizeObserver(sendHeight).observe(root);

  window.editor = {
    exec: exec,
    setMarkdown: function (md) {
      ed.innerHTML = mdToHtml(md || '');
      lastMd = htmlToMd();
      saved = null;
      refreshEmpty();
      refreshToolbar();
      sendHeight();
    },
    focusEnd: function () {
      ed.focus({ preventScroll: true });
      placeCaret(endOfText());
      // Setting the selection from script does not scroll; the caret is at the
      // end, so show the end.
      window.scrollTo(0, document.documentElement.scrollHeight);
      refreshToolbar();
    },
    blur: function () {
      ed.blur();
      window.getSelection().removeAllRanges();
    },
  };

  post({ type: 'ready' });
})();
`;
