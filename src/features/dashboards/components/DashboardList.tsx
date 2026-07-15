"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  ChevronDown,
  Lock,
  MoreHorizontal,
  Search,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Dashboard } from '../types';
import { deleteDashboard, renameDashboard } from '../api';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PromptDialog } from '@/components/ui/PromptDialog';

interface DashboardListProps {
  dashboards: Dashboard[];
  onRefresh: () => void;
}

type SortKey = 'lastViewed' | 'updated' | 'name';

function formatRelative(dateStr?: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const DashboardList: React.FC<DashboardListProps> = ({ dashboards, onRefresh }) => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastViewed');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Dashboard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingRename, setPendingRename] = useState<Dashboard | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = dashboards.filter(
      (d) =>
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.spaceName.toLowerCase().includes(q),
    );

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'updated') cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      else cmp = new Date(a.lastViewedAt ?? a.updatedAt).getTime() - new Date(b.lastViewedAt ?? b.updatedAt).getTime();
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [dashboards, search, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteDashboard(pendingDelete.id);
      setPendingDelete(null);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete dashboard');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmRename = async (newName: string) => {
    if (!pendingRename) return;
    setIsRenaming(true);
    try {
      await renameDashboard(pendingRename.id, newName);
      setPendingRename(null);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to rename dashboard');
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <>
      <div className="dashboard-list-toolbar">
        <button
          type="button"
          className="dashboard-sort-btn"
          onClick={() => toggleSort('lastViewed')}
        >
          Sort <ChevronDown size={14} />
        </button>
        <div className="dashboard-list-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th className="sortable" onClick={() => toggleSort('lastViewed')}>
                Date viewed {sortKey === 'lastViewed' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="sortable" onClick={() => toggleSort('updated')}>
                Date updated {sortKey === 'updated' && (sortAsc ? '↑' : '↓')}
              </th>
              <th>Owner</th>
              <th>Sharing</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="dashboard-table-empty">
                  No dashboards yet. Click &quot;New Dashboard&quot; to create one.
                </td>
              </tr>
            ) : (
              filtered.map((dashboard) => (
                <tr
                  key={dashboard.id}
                  className="dashboard-table-row"
                  onClick={() => router.push(`/dashboards/${dashboard.id}`)}
                >
                  <td>
                    <div className="dashboard-name-cell">
                      <BarChart3 size={16} className="dashboard-row-icon" />
                      <span>{dashboard.name}</span>
                      <Lock size={12} className="dashboard-lock-icon" />
                    </div>
                  </td>
                  <td>{dashboard.spaceName}</td>
                  <td>{formatRelative(dashboard.lastViewedAt ?? dashboard.updatedAt)}</td>
                  <td>{formatRelative(dashboard.updatedAt)}</td>
                  <td>
                    <span className="dashboard-avatar" title={dashboard.ownerName}>
                      {dashboard.ownerInitials}
                    </span>
                  </td>
                  <td>
                    <div className="dashboard-sharing-avatars">
                      {dashboard.sharingMembers.slice(0, 4).map((m) => (
                        <span key={m.id} className="dashboard-avatar small" title={m.name}>
                          {m.initials}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="dashboard-row-menu">
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => setActiveMenu(activeMenu === dashboard.id ? null : dashboard.id)}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {activeMenu === dashboard.id && (
                        <div className="context-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="context-menu-item"
                            onClick={() => {
                              setActiveMenu(null);
                              setPendingRename(dashboard);
                            }}
                          >
                            <Edit2 size={14} /> Rename
                          </button>
                          <button
                            type="button"
                            className="context-menu-item danger"
                            onClick={() => {
                              setActiveMenu(null);
                              setPendingDelete(dashboard);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete Dashboard"
          message={`Delete "${pendingDelete.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={isDeleting}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}

      {pendingRename && (
        <PromptDialog
          title="Rename Dashboard"
          defaultValue={pendingRename.name}
          confirmLabel="Save"
          loading={isRenaming}
          onConfirm={confirmRename}
          onClose={() => setPendingRename(null)}
        />
      )}
    </>
  );
};
