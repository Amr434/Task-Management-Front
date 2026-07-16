"use client";

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Ban, Search, Settings, Plus, Flag, Tag as TagIcon, X, AlertTriangle, Check
} from 'lucide-react';
import { Priority, PRIORITY_META, Tag, User, userInitials, userDisplayName, avatarColor } from '../types';
import { getTags, findOrCreateTag, getProjectMembers } from '../api';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { useI18n } from '@/contexts/I18nContext';

// --- Date helpers (shared) ---
export const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
// Due dates are date-only: anchor them at local noon so the UTC conversion in
// toISOString() (max ±12h shift) can never move them to another calendar day.
export const atNoon = (d: Date) => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const weekday = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short' });
export const shortDate = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

// Priority order to match ClickUp: Urgent, High, Normal, Low.
const PRIORITY_ORDER: Priority[] = [Priority.Urgent, Priority.High, Priority.Medium, Priority.Low];

// Pick black or white text for a coloured pill based on the background's luminance,
// so labels stay readable on light tags (e.g. yellow) and dark ones alike.
export const readableText = (hex: string): string => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#fff';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1e1f21' : '#fff';
};

// Renders tags as compact coloured pills with a "+N" overflow.
export const TagPills: React.FC<{ tags: Tag[]; max?: number; onClick?: (e: React.MouseEvent) => void }> = ({ tags, max = 2, onClick }) => (
  <span className="tag-pills" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
    {tags.slice(0, max).map((t) => (
      <span key={t.id} className="tag-pill" style={{ backgroundColor: t.colorHex, color: readableText(t.colorHex) }}>
        {t.name}
      </span>
    ))}
    {tags.length > max && <span className="tag-pill more">+{tags.length - max}</span>}
  </span>
);

// ---- Priority menu ----
export const PriorityMenu: React.FC<{
  value: Priority | null;
  onSelect: (p: Priority) => void;
  onClear: () => void;
}> = ({ value, onSelect, onClear }) => {
  const { t } = useI18n();
  const priorityLabels: Record<Priority, string> = {
    [Priority.Urgent]: t.priorityUrgent,
    [Priority.High]: t.priorityHigh,
    [Priority.Medium]: t.priorityNormal,
    [Priority.Low]: t.priorityLow,
  };
  return (
  <div className="composer-dropdown">
    <div className="dd-section-title">{t.priorityLabel}</div>
    {PRIORITY_ORDER.map((p) => (
      <button
        key={p}
        className={`dd-row ${value === p ? 'selected' : ''}`}
        onClick={() => onSelect(p)}
      >
        <Flag size={17} style={{ color: PRIORITY_META[p].color }} />
        <span>{priorityLabels[p]}</span>
      </button>
    ))}
    <div className="dd-divider" />
    <button className="dd-row" onClick={onClear}>
      <Ban size={17} /> <span>{t.clear}</span>
    </button>
  </div>
  );
};

// ---- Status menu ----
export const StatusMenu: React.FC<{
  value?: number | null;
  onSelect: (s: number) => void;
}> = ({ value, onSelect }) => {
  const { t } = useI18n();
  return (
  <div className="composer-dropdown status-dropdown" style={{ minWidth: '280px' }}>
    <div className="dd-search">
      <input placeholder={t.searchPlaceholder} autoFocus />
    </div>
    
    <div className="dd-section-warning" style={{ margin: '8px 12px' }}>
      <AlertTriangle size={14} className="warning-icon" />
      <span>{t.statusMenuWarning}</span>
    </div>
    
    <div className="dd-section-title" style={{ marginTop: '4px' }}>{t.notStarted}</div>
    <button
      className={`dd-row status-row ${value === 0 ? 'selected' : ''}`}
      onClick={() => onSelect(0)}
    >
      <span className="status-dot todo"></span>
      <span>{t.statusToDo}</span>
    </button>
    
    <div className="dd-section-title">{t.activeGroup}</div>
    <button
      className={`dd-row status-row ${value === 1 ? 'selected' : ''}`}
      onClick={() => onSelect(1)}
    >
      <span className="status-dot in-progress"></span>
      <span>{t.statusInProgress}</span>
    </button>
    
    <div className="dd-section-title">{t.closedGroupTitle}</div>
    <button
      className={`dd-row status-row ${value === 2 ? 'selected' : ''}`}
      onClick={() => onSelect(2)}
    >
      <span className="status-dot complete"></span>
      <span>{t.statusComplete}</span>
    </button>

    <div className="dd-divider" />
    <div className="dd-row dd-row-between" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="toggle-switch on"><div className="toggle-knob"></div></div>
        <span>Send notifications</span>
      </div>
    </div>
  </div>
  );
};

// ---- Avatar helpers (DB-backed users) ----
export const Avatar: React.FC<{ user: User; size?: 'sm' | 'md'; title?: boolean }> = ({ user, size = 'md', title = true }) => (
  <span
    className={`dd-avatar ${size === 'sm' ? 'sm' : ''}`}
    style={{ backgroundColor: avatarColor(user) }}
    title={title ? userDisplayName(user) : undefined}
  >
    {userInitials(user)}
  </span>
);

// Overlapping avatar stack with a "+N" overflow chip.
export const AvatarStack: React.FC<{ users: User[]; max?: number; size?: 'sm' | 'md' }> = ({ users, max = 3, size = 'sm' }) => {
  if (!users || users.length === 0) return null;
  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;
  return (
    <span className="avatar-stack">
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} />
      ))}
      {overflow > 0 && <span className={`dd-avatar ${size === 'sm' ? 'sm' : ''} more`}>+{overflow}</span>}
    </span>
  );
};

// ---- Assignee menu (project members only: owner + accepted invitees) ----
export const AssigneeMenu: React.FC<{
  projectId: number | null;
  selected: User[];
  onToggle: (user: User) => void;
}> = ({ projectId, selected, onToggle }) => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId == null) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getProjectMembers(projectId)
      .then(setUsers)
      .catch((e) => console.warn('Failed to load project members', e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [projectId]);

  const currentUserId = useAuthStore((s) => s.user?.id);

  const trimmed = query.trim().toLowerCase();
  const selectedIds = new Set(selected.map((u) => u.id));
  const matches = users
    .filter(
      (u) => userDisplayName(u).toLowerCase().includes(trimmed) || u.email.toLowerCase().includes(trimmed)
    )
    // Signed-in user first, shown as "Me".
    .sort((a, b) => Number(b.id === currentUserId) - Number(a.id === currentUserId));

  return (
    <div className="composer-dropdown assignee-dropdown">
      <div className="dd-search">
        <Search size={15} />
        <input
          placeholder={t.searchPeople}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="dd-section-title">People</div>

      {loading && <div className="dd-empty">Loading…</div>}
      {!loading && matches.length === 0 && <div className="dd-empty">{t.noPeopleFound}</div>}

      {!loading && matches.map((u) => {
        const isSel = selectedIds.has(u.id);
        return (
          <button key={u.id} className={`dd-row ${isSel ? 'selected' : ''}`} onClick={() => onToggle(u)}>
            <Avatar user={u} size="sm" title={false} />
            <span>{u.id === currentUserId ? 'Me' : userDisplayName(u)}</span>
            {isSel && <Check size={15} style={{ marginLeft: 'auto' }} />}
          </button>
        );
      })}
    </div>
  );
};

// ---- Date picker menu ----
export const DateMenu: React.FC<{
  value: Date | null;
  onSelect: (d: Date) => void;
  onClear: () => void;
}> = ({ value, onSelect, onClear }) => {
  const { t } = useI18n();
  const today = startOfDay(new Date());
  const dow = today.getDay(); // 0 Sun .. 6 Sat
  const daysUntilSat = (6 - dow + 7) % 7; // upcoming Saturday (0 if today is Sat)
  const daysUntilMon = ((1 - dow + 7) % 7) || 7; // next Monday

  const quick: { label: string; date: Date; hint: string }[] = [
    { label: t.today, date: today, hint: weekday(today) },
    { label: t.tomorrow, date: addDays(today, 1), hint: weekday(addDays(today, 1)) },
    { label: t.thisWeekend, date: addDays(today, daysUntilSat), hint: 'Sat' },
    { label: t.nextWeek, date: addDays(today, daysUntilMon), hint: shortDate(addDays(today, daysUntilMon)) },
    { label: t.nextWeekend, date: addDays(today, daysUntilSat + 7), hint: shortDate(addDays(today, daysUntilSat + 7)) },
    { label: t.twoWeeks, date: addDays(today, 14), hint: shortDate(addDays(today, 14)) },
    { label: t.fourWeeks, date: addDays(today, 28), hint: shortDate(addDays(today, 28)) },
  ];

  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const firstDow = viewMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));

  return (
    <div className="composer-dropdown date-dropdown">
      <div className="date-dropdown-body">
        <div className="date-quick-list">
          {quick.map((q) => (
            <button key={q.label} className="date-quick-row" onClick={() => onSelect(atNoon(q.date))}>
              <span>{q.label}</span>
              <span className="date-quick-hint">{q.hint}</span>
            </button>
          ))}
          {value && (
            <button className="date-quick-row danger" onClick={onClear}>
              <span>{t.clear}</span>
              <Ban size={15} />
            </button>
          )}
        </div>

        <div className="date-calendar">
          <div className="date-cal-header">
            <span className="date-cal-month">{monthLabel}</span>
            <div className="date-cal-nav">
              <button onClick={() => setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))} title="Today">
                <span className="date-cal-today-dot" />
              </button>
              <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="date-cal-grid date-cal-dow">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="date-cal-dow-label">{d}</span>
            ))}
          </div>
          <div className="date-cal-grid">
            {cells.map((cell, i) =>
              cell ? (
                <button
                  key={i}
                  className={`date-cal-day ${sameDay(cell, today) ? 'today' : ''} ${value && sameDay(cell, value) ? 'selected' : ''}`}
                  onClick={() => onSelect(atNoon(cell))}
                >
                  {cell.getDate()}
                </button>
              ) : (
                <span key={i} className="date-cal-day empty" />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Tag menu (DB-backed: searches existing tags, creates on demand, names unique) ----
export const TagMenu: React.FC<{ selected: Tag[]; onChange: (tags: Tag[]) => void }> = ({ selected, onChange }) => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getTags()
      .then(setAllTags)
      .catch((e) => console.warn('Failed to load tags', e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const trimmed = query.trim();
  const selectedIds = new Set(selected.map((t) => t.id));
  const matches = allTags.filter(
    (t) => t.name.toLowerCase().includes(trimmed.toLowerCase()) && !selectedIds.has(t.id)
  );
  // Only offer "create" when no tag with that exact name already exists (names are unique).
  const exactExists = allTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
  const canCreate = trimmed.length > 0 && !exactExists;

  const addTag = (tag: Tag) => {
    if (!selectedIds.has(tag.id)) onChange([...selected, tag]);
    setQuery('');
  };

  const handleCreate = async () => {
    if (!canCreate || creating) return;
    setCreating(true);
    try {
      const tag = await findOrCreateTag(trimmed, allTags);
      setAllTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
      addTag(tag);
    } catch (e) {
      console.warn('Failed to create tag', e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const removeTag = (tag: Tag) => onChange(selected.filter((t) => t.id !== tag.id));

  return (
    <div className="composer-dropdown tag-dropdown">
      <div className="dd-search">
        <input
          placeholder={t.searchOrAddTags}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
        />
      </div>
      <div className="dd-row-between dd-section-title">
        <span>Select an option</span>
        <Settings size={15} />
      </div>

      {loading && <div className="dd-empty">Loading…</div>}

      {!loading && canCreate && (
        <button className="dd-row" onClick={handleCreate} disabled={creating}>
          <Plus size={16} /> <span>{creating ? t.creating : t.createTagBtn.replace('{name}', trimmed)}</span>
        </button>
      )}

      {!loading && matches.map((tag) => (
        <button key={tag.id} className="dd-row" onClick={() => addTag(tag)}>
          <TagIcon size={15} style={{ color: tag.colorHex }} /> <span>{tag.name}</span>
        </button>
      ))}

      {!loading && matches.length === 0 && !canCreate && selected.length === 0 && (
        <div className="dd-empty">No tags created</div>
      )}

      {selected.length > 0 && <div className="dd-divider" />}
      {selected.map((tag) => (
        <button key={tag.id} className="dd-row selected" onClick={() => removeTag(tag)} title="Remove">
          <TagIcon size={15} style={{ color: tag.colorHex }} /> <span>{tag.name}</span>
          <X size={14} style={{ marginLeft: 'auto' }} />
        </button>
      ))}
    </div>
  );
};

export type { Tag };
