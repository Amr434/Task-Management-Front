import { userDisplayName, type User } from '../tasks/types';

// @mentions in comments. A mention is "@" + the person's display name
// ("@Sara Ali"), picked from the project's members while typing.

export interface MentionQuery {
  // Index of the "@" in the text.
  start: number;
  // What's typed after it so far.
  query: string;
}

// The mention being typed just before the caret, if any: an "@" at the start
// or after a space, followed by at most two words (first and last name).
export function findMentionQuery(text: string, caret: number): MentionQuery | null {
  const before = text.slice(0, caret);
  const match = /(^|\s)@([^\s@]*(?: [^\s@]*)?)$/.exec(before);
  if (!match) return null;
  return { start: match.index + match[1].length, query: match[2] };
}

// Members whose name (or email) starts with — or contains a word starting
// with — the query.
export function mentionCandidates(members: User[], query: string, limit = 6): User[] {
  const q = query.trim().toLowerCase();
  if (!q) return members.slice(0, limit);
  return members
    .filter((m) => {
      const name = userDisplayName(m).toLowerCase();
      return name.startsWith(q) || name.split(' ').some((w) => w.startsWith(q)) || m.email.toLowerCase().startsWith(q);
    })
    .slice(0, limit);
}

// Replaces the "@query" being typed with the picked person's name.
// Returns the new text and where the caret should go.
export function insertMention(text: string, mention: MentionQuery, caret: number, user: User) {
  const inserted = `@${userDisplayName(user)} `;
  const next = text.slice(0, mention.start) + inserted + text.slice(caret);
  return { text: next, caret: mention.start + inserted.length };
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "@Name" for each member, longest first so "@Sara Ali" wins over "@Sara".
const mentionPattern = (members: User[]) => {
  const names = members
    .map((m) => userDisplayName(m))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  return names.length ? new RegExp(`@(${names.join('|')})(?![\\w])`, 'g') : null;
};

// The members mentioned in the text (sent with a new comment).
export function mentionedUserIds(text: string, members: User[]): number[] {
  const pattern = mentionPattern(members);
  if (!pattern) return [];
  const names = new Set(Array.from(text.matchAll(pattern), (m) => m[1]));
  return members.filter((m) => names.has(userDisplayName(m))).map((m) => m.id);
}

// The text split into plain parts and mentions, for highlighting.
export function splitMentions(text: string, members: User[]): { text: string; mention: boolean }[] {
  const pattern = mentionPattern(members);
  if (!pattern) return [{ text, mention: false }];
  const parts: { text: string; mention: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ text: text.slice(last, at), mention: false });
    parts.push({ text: m[0], mention: true });
    last = at + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), mention: false });
  return parts;
}
