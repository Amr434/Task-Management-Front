'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { buildEditorHtml, TOOLBAR_HEIGHT } from '@task/core/features/tasks/richText';

import { useThemeStore } from '@/features/theme/store/useThemeStore';
import { resolveThemePalette } from '@/features/theme/utils/applyTheme';

/**
 * The description editor, sharing its page with the mobile app
 * (@task/core/features/tasks/richText) so the two toolbars cannot drift.
 *
 * It lives in an iframe rather than a contenteditable div in this tree, for the
 * same reason the mobile one lives in a WebView: the page owns the caret and the
 * selection, and a toolbar rendered outside it steals focus on mousedown, which
 * collapses the selection before the command can run.
 *
 * The iframe uses srcDoc, so it stays same-origin and `contentWindow.editor` is
 * callable directly; it is deliberately not sandboxed, since sandboxing without
 * allow-same-origin would put it in an opaque origin and cut off that access.
 * The document is our own string, never user-supplied HTML.
 */

type EditorMessage =
  | { type: 'ready' }
  | { type: 'change'; markdown: string }
  | { type: 'height'; height: number };

interface EditorWindow extends Window {
  editor?: {
    setMarkdown: (md: string) => void;
    focusEnd: () => void;
    blur: () => void;
  };
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = '',
  minHeight = 120,
  autoFocus = false,
}: {
  value: string;
  onChange: (markdown: string) => void;
  /** Called once the caret leaves the page, for save-on-blur callers. */
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: number;
  autoFocus?: boolean;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  // What the page currently holds, so our own edits are not pushed back into it
  // (that would reset the caret on every keystroke).
  const inPage = useRef(value);
  // Read through a ref so the page is not rebuilt whenever the parent re-renders
  // with a new callback identity. Assigned in an effect, never during render.
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  // The page announces itself asynchronously, so the handler must read the text
  // as it is when 'ready' arrives, not as it was when the listener was attached.
  const valueRef = useRef(value);
  useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
    valueRef.current = value;
  });

  const [height, setHeight] = useState(minHeight + TOOLBAR_HEIGHT);

  const mode = useThemeStore((s) => s.mode);
  const color = useThemeStore((s) => s.color);

  // Rebuilding the page throws away what is in it, so this depends only on what
  // the document bakes in — the theme and the placeholder, never the text.
  const html = useMemo(() => {
    const p = resolveThemePalette(mode, color);
    if (!p) return null;
    return buildEditorHtml({
      background: p.bgMain,
      text: p.textPrimary,
      secondary: p.textSecondary,
      // There is no faint tone on web; secondary is already what placeholders
      // and ticked-off checklist items use elsewhere.
      faint: p.textSecondary,
      border: p.border,
      accent: p.accent,
      accentMuted: p.accentMuted,
      fill: false,
      placeholder,
      minHeight,
    });
  }, [mode, color, placeholder, minHeight]);

  // A rebuilt document is a fresh page; it has to announce itself again before
  // anything may be pushed into it.
  useEffect(() => {
    ready.current = false;
  }, [html]);

  // Text replaced from outside (a different task opened, or the form reset).
  useEffect(() => {
    if (!ready.current || value === inPage.current) return;
    inPage.current = value;
    (frameRef.current?.contentWindow as EditorWindow | null)?.editor?.setMarkdown(value);
  }, [value]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only trust the document this component owns.
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;

      let msg: EditorMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'ready': {
          ready.current = true;
          const text = valueRef.current;
          inPage.current = text;
          const win = frameRef.current.contentWindow as EditorWindow | null;
          win?.editor?.setMarkdown(text);
          if (autoFocus) win?.editor?.focusEnd();
          break;
        }
        case 'change':
          inPage.current = msg.markdown;
          onChangeRef.current(msg.markdown);
          break;
        case 'height':
          setHeight(Math.max(minHeight + TOOLBAR_HEIGHT, msg.height));
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [autoFocus, minHeight]);

  // focusout inside the iframe does not bubble out to this document, so
  // save-on-blur has to be wired from within the page's own window.
  //
  // It is attached on load rather than in an effect: listeners belong to the
  // Window, and reloading the document (which a theme change does) replaces it,
  // silently dropping anything bound to the previous one.
  const attachBlur = () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.addEventListener('blur', () => onBlurRef.current?.());
  };

  if (!html) return <div className="rte-frame" style={{ height }} />;

  return (
    <iframe
      ref={frameRef}
      className="rte-frame"
      title={placeholder || 'Description'}
      srcDoc={html}
      onLoad={attachBlur}
      style={{ height }}
    />
  );
}
