import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { useTheme, type Theme } from '@/theme';

/**
 * Read-only rendering of the Markdown the rich editor writes: headings, bullets,
 * checkboxes, and bold / italic / strike / code. Only that subset is handled —
 * it is all the editor can produce.
 */

type InlineKind = 'bold' | 'italic' | 'strike' | 'code';
type InlineNode = string | { kind: InlineKind; children: InlineNode[] };

const PATTERNS: { kind: InlineKind; re: RegExp }[] = [
  { kind: 'code', re: /`([^`]+)`/ },
  { kind: 'bold', re: /\*\*(.+?)\*\*/ },
  { kind: 'strike', re: /~~(.+?)~~/ },
  // Underscores inside words (file_name_here) are not italics.
  { kind: 'italic', re: /(^|[^A-Za-z0-9_])_(?!\s)(.+?)_(?![A-Za-z0-9_])/ },
];

function parseInline(text: string): InlineNode[] {
  let best: { kind: InlineKind; start: number; end: number; inner: string } | null = null;

  for (const { kind, re } of PATTERNS) {
    const m = re.exec(text);
    if (!m) continue;
    const lead = kind === 'italic' ? m[1].length : 0;
    const start = m.index + lead;
    if (!best || start < best.start) {
      best = { kind, start, end: m.index + m[0].length, inner: kind === 'italic' ? m[2] : m[1] };
    }
  }

  if (!best) return text ? [text] : [];
  return [
    ...(best.start > 0 ? [text.slice(0, best.start)] : []),
    { kind: best.kind, children: best.kind === 'code' ? [best.inner] : parseInline(best.inner) },
    ...parseInline(text.slice(best.end)),
  ];
}

function renderInline(nodes: InlineNode[], theme: Theme, keyPrefix = ''): ReactNode[] {
  return nodes.map((node, i) => {
    const key = `${keyPrefix}${i}`;
    if (typeof node === 'string') return node;
    const style =
      node.kind === 'bold'
        ? styles.bold
        : node.kind === 'italic'
          ? styles.italic
          : node.kind === 'strike'
            ? styles.strike
            : [styles.code, { backgroundColor: theme.accentMuted, color: theme.accent }];
    return (
      <Text key={key} style={style}>
        {renderInline(node.children, theme, `${key}-`)}
      </Text>
    );
  });
}

export function MarkdownPreview({ markdown }: { markdown: string }) {
  const theme = useTheme();
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');

  return (
    <View style={styles.wrap}>
      {lines.map((line, i) => {
        let m: RegExpExecArray | null;

        if ((m = /^- \[( |x|X)\] ?(.*)$/.exec(line))) {
          const done = m[1] !== ' ';
          return (
            <View key={i} style={styles.listRow}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: done ? theme.accent : theme.textFaint },
                  done ? { backgroundColor: theme.accent } : null,
                ]}
              >
                {done ? <Icon name="check" size={11} color="#fff" /> : null}
              </View>
              <Text
                style={[
                  styles.body,
                  styles.flex,
                  { color: done ? theme.textFaint : theme.textPrimary },
                  done ? styles.strike : null,
                ]}
              >
                {renderInline(parseInline(m[2]), theme)}
              </Text>
            </View>
          );
        }

        if ((m = /^[-*] (.*)$/.exec(line))) {
          return (
            <View key={i} style={styles.listRow}>
              <Text style={[styles.body, styles.bullet, { color: theme.textPrimary }]}>{'•'}</Text>
              <Text style={[styles.body, styles.flex, { color: theme.textPrimary }]}>
                {renderInline(parseInline(m[1]), theme)}
              </Text>
            </View>
          );
        }

        if ((m = /^(#{1,2}) (.*)$/.exec(line))) {
          return (
            <Text key={i} style={[m[1] === '#' ? styles.h1 : styles.h2, { color: theme.textPrimary }]}>
              {renderInline(parseInline(m[2]), theme)}
            </Text>
          );
        }

        return (
          <Text key={i} style={[styles.body, { color: theme.textPrimary }]}>
            {line ? renderInline(parseInline(line), theme) : ' '}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  body: { fontSize: 15, lineHeight: 22 },
  flex: { flex: 1 },
  h1: { fontSize: 21, lineHeight: 28, fontWeight: '700', marginVertical: 3 },
  h2: { fontSize: 17, lineHeight: 24, fontWeight: '700', marginVertical: 2 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  strike: { textDecorationLine: 'line-through' },
  code: { fontFamily: 'monospace', fontSize: 13 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { width: 12, textAlign: 'center' },
  checkbox: {
    width: 17,
    height: 17,
    borderWidth: 2,
    borderRadius: 5,
    marginTop: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
