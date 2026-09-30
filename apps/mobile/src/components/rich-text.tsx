import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildEditorHtml, TOOLBAR_HEIGHT } from '@task/core/features/tasks/richText';

import { useTheme } from '@/theme';



export interface RichTextEditorHandle {
  /** Closes the keyboard. Keyboard.dismiss() only knows about native inputs. */
  blur: () => void;
}

type EditorMessage =
  | { type: 'ready' }
  | { type: 'change'; markdown: string }
  | { type: 'height'; height: number };

export function RichTextEditor({
  value,
  onChangeText,
  placeholder,
  minHeight = 200,
  fill = false,
  autoFocus = false,
  ref,
}: {
  value: string;
  onChangeText: (markdown: string) => void;
  placeholder?: string;
  minHeight?: number;
  /** Take the whole screen and scroll inside, with the toolbar pinned on top. */
  fill?: boolean;
  /** Put the caret at the end of the text and open the keyboard once loaded. */
  autoFocus?: boolean;
  ref?: Ref<RichTextEditorHandle>;
}) {
  const theme = useTheme();
  const webRef = useRef<WebView>(null);
  const ready = useRef(false);
  // The Markdown the page currently holds, so our own edits are not pushed back
  // into it (that would reset the caret on every keystroke).
  const inPage = useRef(value);
  const fullMin = minHeight + TOOLBAR_HEIGHT;
  const [height, setHeight] = useState(fullMin);

  const run = (js: string) => webRef.current?.injectJavaScript(`${js};true;`);

  const background = fill ? theme.bgMain : theme.bgCanvas;

  const html = useMemo(
    () =>
      buildEditorHtml({
        background,
        fill,
        text: theme.textPrimary,
        secondary: theme.textSecondary,
        faint: theme.textFaint,
        border: theme.border,
        accent: theme.accent,
        accentMuted: theme.accentMuted,
        placeholder: placeholder ?? '',
        minHeight,
      }),
    [
      background,
      fill,
      theme.textPrimary,
      theme.textSecondary,
      theme.textFaint,
      theme.border,
      theme.accent,
      theme.accentMuted,
      placeholder,
      minHeight,
    ]
  );

  // Text replaced from outside (e.g. the screen resets the form).
  useEffect(() => {
    if (!ready.current || value === inPage.current) return;
    inPage.current = value;
    run(`window.editor.setMarkdown(${JSON.stringify(value)})`);
  }, [value]);

  useImperativeHandle(ref, () => ({ blur: () => run('window.editor.blur()') }), []);

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: EditorMessage;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'ready':
        // Also fires again if the page reloads (theme change), so refill it.
        ready.current = true;
        inPage.current = value;
        run(`window.editor.setMarkdown(${JSON.stringify(value)})`);
        if (autoFocus) {
          // Android only raises the keyboard for a WebView that holds native focus.
          webRef.current?.requestFocus();
          run('window.editor.focusEnd()');
        }
        break;
      case 'change':
        inPage.current = msg.markdown;
        onChangeText(msg.markdown);
        break;
      case 'height':
        if (!fill) setHeight(Math.max(fullMin, msg.height));
        break;
    }
  };

  return (
    <View
      style={
        fill
          ? [styles.fill, { backgroundColor: background }]
          : [styles.wrap, { borderColor: theme.border, backgroundColor: background }]
      }
    >
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        style={fill ? styles.fill : { height, backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
        // Inline, the page grows to fit its text and the screen's ScrollView
        // scrolls; full screen, the page scrolls itself.
        scrollEnabled={fill}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        hideKeyboardAccessoryView
        keyboardDisplayRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        textZoom={100}
        setSupportMultipleWindows={false}
        // Lets chrome://inspect (Android) or Safari (iOS) attach while developing.
        webviewDebuggingEnabled={__DEV__}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  fill: { flex: 1, backgroundColor: 'transparent' },
});
