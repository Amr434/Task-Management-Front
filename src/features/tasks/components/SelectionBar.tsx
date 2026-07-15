import React, { useEffect, useRef, useState } from 'react';
import { useTaskSelection } from '@/contexts/TaskSelectionContext';
import { X, CheckCircle2, Users, Calendar, Settings2, Tag, Copy, Trash2, MoreHorizontal, ArrowRightCircle } from 'lucide-react';
import { TaskItem, TaskStatus, Tag as TagType, User } from '../types';
import { patchTask, deleteTask, addTagToTask, assignUserToTask, removeUserFromTask } from '../api';
import { StatusMenu, AssigneeMenu, DateMenu, TagMenu } from './TaskFieldMenus';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSpaceStore } from '@/store/useSpaceStore';

interface SelectionBarProps {
  allTasks?: TaskItem[];
}

type MenuType = 'status' | 'assignee' | 'date' | 'tag' | 'delete' | null;

export const SelectionBar: React.FC<SelectionBarProps> = ({ allTasks = [] }) => {
  const { updateTaskLocally, deleteTaskLocally } = useSpaceStore();
  const { selectedTaskIds, clearSelection } = useTaskSelection();
  const [openMenu, setOpenMenu] = useState<MenuType>(null);
  const [loading, setLoading] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDocClick = (e: MouseEvent) => {
      // Exclude clicks inside the menu anchors from closing it, ConfirmDialog has its own backdrop
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        if (openMenu !== 'delete') setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMenu]);

  if (selectedTaskIds.length === 0) return null;

  const selectedTasks = allTasks.filter(t => selectedTaskIds.includes(t.id));
  const commonStatus = selectedTasks.length > 0 && selectedTasks.every(t => t.status === selectedTasks[0].status) ? selectedTasks[0].status : null;

  const handleBulkUpdate = async (patch: Partial<TaskItem>) => {
    setLoading(true);
    try {
      // Apply the patch locally instead of the PUT response — the response
      // comes back without tags/assignees and would wipe them from the store.
      await Promise.all(selectedTasks.map(t => patchTask(t, patch).then(() => updateTaskLocally(t.id, patch))));
      clearSelection();
    } catch (e) {
      console.warn("Bulk update failed", e);
    } finally {
      setLoading(false);
      setOpenMenu(null);
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const childrenByParent: Record<number, TaskItem[]> = {};
      allTasks.forEach(t => {
        if (t.parentTaskId != null) {
          (childrenByParent[t.parentTaskId] = childrenByParent[t.parentTaskId] || []).push(t);
        }
      });

      const allToDelete = new Map<number, TaskItem>();
      
      for (const t of selectedTasks) {
        const stack = [t];
        while (stack.length > 0) {
          const current = stack.pop()!;
          if (!allToDelete.has(current.id)) {
            allToDelete.set(current.id, current);
            const children = childrenByParent[current.id] || [];
            stack.push(...children);
          }
        }
      }

      // Delete bottom-up: repeatedly find nodes that have no children currently in allToDelete
      let remaining = Array.from(allToDelete.values());
      while (remaining.length > 0) {
        const leaves = remaining.filter(t => {
          const children = childrenByParent[t.id] || [];
          // It is a leaf if none of its children are in the remaining list
          return !children.some(child => remaining.some(r => r.id === child.id));
        });

        // Delete all leaves in parallel
        await Promise.all(leaves.map(t => deleteTask(t.id)));

        // Remove leaves from remaining
        const leafIds = new Set(leaves.map(l => l.id));
        remaining = remaining.filter(t => !leafIds.has(t.id));
      }

      Array.from(allToDelete.values()).forEach(t => deleteTaskLocally(t.id));
      clearSelection();
    } catch (e) {
      console.warn("Bulk delete failed", e);
    } finally {
      setLoading(false);
      setOpenMenu(null);
    }
  };

  const handleBulkTags = async (newTags: TagType[]) => {
    setLoading(true);
    try {
      for (const t of selectedTasks) {
        const existingIds = t.tags?.map(x => x.id) || [];
        const toAdd = newTags.filter(n => !existingIds.includes(n.id));
        await Promise.all(toAdd.map(tag => addTagToTask(t.id, tag.id)));
        
        if (toAdd.length > 0) {
          const mergedTags = [...(t.tags || []), ...toAdd];
          updateTaskLocally(t.id, { tags: mergedTags });
        }
      }
      clearSelection();
    } catch (e) {
      console.warn("Bulk tag update failed", e);
    } finally {
      setLoading(false);
      setOpenMenu(null);
    }
  };

  // Users assigned to *every* selected task — reflected as "checked" in the menu.
  const commonAssignees: User[] = selectedTasks.length > 0
    ? (selectedTasks[0].assignees ?? []).filter(u =>
        selectedTasks.every(t => (t.assignees ?? []).some(a => a.id === u.id)))
    : [];

  const handleBulkAssignee = async (user: User) => {
    const onAll = selectedTasks.every(t => (t.assignees ?? []).some(a => a.id === user.id));
    setLoading(true);
    try {
      for (const t of selectedTasks) {
        const current = t.assignees ?? [];
        const has = current.some(a => a.id === user.id);
        if (onAll && has) {
          await removeUserFromTask(t.id, user.id);
          updateTaskLocally(t.id, { assignees: current.filter(a => a.id !== user.id) });
        } else if (!onAll && !has) {
          await assignUserToTask(t.id, user.id);
          updateTaskLocally(t.id, { assignees: [...current, user] });
        }
      }
    } catch (e) {
      console.warn("Bulk assignee update failed", e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (menu: MenuType) => setOpenMenu(cur => cur === menu ? null : menu);

  return (
    <>
      <div className="selection-bar-wrapper">
        <div className="selection-bar" ref={barRef}>
          <div className="selection-count-pill">
            <span>{selectedTaskIds.length} Task{selectedTaskIds.length > 1 ? 's' : ''} selected</span>
            <button className="clear-selection-btn" onClick={clearSelection}>
              <X size={14} />
            </button>
          </div>
          
          <div className="selection-actions">
            <div className="row-action-wrap">
              <button className="selection-action-btn" onClick={() => toggle('status')}><CheckCircle2 size={14} /> Status</button>
              {openMenu === 'status' && (
                <div className="popup-anchor top">
                  <StatusMenu value={commonStatus} onSelect={(s) => handleBulkUpdate({ status: s })} />
                </div>
              )}
            </div>

            <div className="row-action-wrap">
              <button className="selection-action-btn" onClick={() => toggle('assignee')}><Users size={14} /> Assignees</button>
              {openMenu === 'assignee' && (
                <div className="popup-anchor top">
                  <AssigneeMenu projectId={selectedTasks[0]?.projectId ?? null} selected={commonAssignees} onToggle={handleBulkAssignee} />
                </div>
              )}
            </div>

            <div className="row-action-wrap">
              <button className="selection-action-btn" onClick={() => toggle('date')}><Calendar size={14} /> Dates</button>
              {openMenu === 'date' && (
                <div className="popup-anchor top">
                  <DateMenu value={null} onSelect={(d) => handleBulkUpdate({ dueDate: d.toISOString() })} onClear={() => handleBulkUpdate({ dueDate: undefined })} />
                </div>
              )}
            </div>

            <div className="row-action-wrap">
              <button className="selection-action-btn" onClick={() => toggle('tag')}><Tag size={14} /> Tags</button>
              {openMenu === 'tag' && (
                <div className="popup-anchor top">
                  <TagMenu selected={[]} onChange={(tags) => handleBulkTags(tags)} />
                </div>
              )}
            </div>

            <div className="selection-divider" />
            
            <button className="selection-action-btn delete-btn" onClick={() => setOpenMenu('delete')}><Trash2 size={14} /></button>
          </div>
        </div>
      </div>

      {openMenu === 'delete' && (
        <ConfirmDialog
          title={`Delete ${selectedTaskIds.length} Task${selectedTaskIds.length > 1 ? 's' : ''}?`}
          message="Are you sure you want to delete the selected tasks? This action cannot be undone."
          danger
          confirmLabel="Delete"
          loading={loading}
          onConfirm={handleBulkDelete}
          onClose={() => setOpenMenu(null)}
        />
      )}
    </>
  );
};
