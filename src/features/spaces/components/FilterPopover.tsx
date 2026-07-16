import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trash2, Info, ChevronDown, X } from 'lucide-react';
import { useSpaceStore } from '@/store/useSpaceStore';
import { Priority, TaskStatus, Tag } from '@/features/tasks/types';
import { useI18n } from '@/contexts/I18nContext';

interface FilterPopoverProps {
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

type FilterType = 'status' | 'priority' | 'tags' | 'name';

export const FilterPopover: React.FC<FilterPopoverProps> = ({ onClose, anchorRef }) => {
  const { t } = useI18n();
  const popoverRef = useRef<HTMLDivElement>(null);
  const tasksByProjectId = useSpaceStore((s) => s.tasksByProjectId);

  // Zustand state and actions
  const filterQuery = useSpaceStore((s) => s.filterQuery);
  const filterPriority = useSpaceStore((s) => s.filterPriority);
  const filterStatus = useSpaceStore((s) => s.filterStatus);
  const filterTagId = useSpaceStore((s) => s.filterTagId);

  const setFilterQuery = useSpaceStore((s) => s.setFilterQuery);
  const setFilterPriority = useSpaceStore((s) => s.setFilterPriority);
  const setFilterStatus = useSpaceStore((s) => s.setFilterStatus);
  const setFilterTagId = useSpaceStore((s) => s.setFilterTagId);

  // Sub-menus state
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Extract all tags from loaded tasks
  const availableTags = useMemo(() => {
    const map = new Map<number, Tag>();
    Object.values(tasksByProjectId)
      .flat()
      .forEach((t) => {
        t.tags?.forEach((tag) => map.set(tag.id, tag));
      });
    return Array.from(map.values());
  }, [tasksByProjectId]);

  // Determine active rows in the filter builder
  const activeFilters = useMemo(() => {
    const list: { type: FilterType; label: string }[] = [];
    if (filterStatus !== null) list.push({ type: 'status', label: t.statusLabel });
    if (filterPriority !== null) list.push({ type: 'priority', label: t.colPriority });
    if (filterTagId !== null) list.push({ type: 'tags', label: t.colTags });
    if (filterQuery !== '') list.push({ type: 'name', label: t.colName });
    return list;
  }, [filterStatus, filterPriority, filterTagId, filterQuery]);

  // Position popover relative to the anchor button
  const [style, setStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: 'absolute',
        top: `${rect.bottom + window.scrollY + 8}px`,
        left: `${rect.left + window.scrollX}px`,
        zIndex: 1000,
      });
    }
  }, [anchorRef]);

  // Close on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  const handleAddFilter = (type: FilterType) => {
    setShowAddMenu(false);
    if (type === 'status') setFilterStatus(TaskStatus.ToDo);
    if (type === 'priority') setFilterPriority(Priority.Medium);
    if (type === 'tags') {
      if (availableTags.length > 0) setFilterTagId(availableTags[0].id);
    }
    if (type === 'name') setFilterQuery(' ');
  };

  const handleRemoveFilter = (type: FilterType) => {
    if (type === 'status') setFilterStatus(null);
    if (type === 'priority') setFilterPriority(null);
    if (type === 'tags') setFilterTagId(null);
    if (type === 'name') setFilterQuery('');
  };

  // Get available filter types that aren't already active
  const addableTypes = useMemo(() => {
    const activeTypes = activeFilters.map((f) => f.type);
    const all: { type: FilterType; label: string }[] = [
      { type: 'status', label: t.statusLabel },
      { type: 'tags', label: t.colTags },
      { type: 'priority', label: t.colPriority },
      { type: 'name', label: t.colName },
    ];
    return all.filter((item) => !activeTypes.includes(item.type));
  }, [activeFilters]);

  return (
    <div ref={popoverRef} className="clickup-filter-popover" style={style}>
      <div className="filter-popover-header">
        <div className="header-left">
          <span className="title">{t.filters}</span>
          <Info size={14} className="info-icon" />
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="filter-popover-body">
        {activeFilters.length === 0 ? (
          <div className="empty-filters-message">No active filters. Select one below to start.</div>
        ) : (
          <div className="filter-rules-list">
            {activeFilters.map((filter) => (
              <div key={filter.type} className="filter-rule-row">
                <span className="rule-field-name">{filter.label}</span>
                <span className="rule-operator">is</span>
                
                <div className="rule-value-container">
                  {filter.type === 'status' && (
                    <select
                      value={filterStatus ?? ''}
                      onChange={(e) => setFilterStatus(Number(e.target.value))}
                      className="rule-select"
                    >
                      <option value={TaskStatus.ToDo}>TO DO</option>
                      <option value={TaskStatus.InProgress}>IN PROGRESS</option>
                      <option value={TaskStatus.Complete}>COMPLETE</option>
                    </select>
                  )}

                  {filter.type === 'priority' && (
                    <select
                      value={filterPriority ?? ''}
                      onChange={(e) => setFilterPriority(Number(e.target.value))}
                      className="rule-select"
                    >
                      <option value={Priority.Low}>{t.priorityLow}</option>
                      <option value={Priority.Medium}>{t.priorityNormal}</option>
                      <option value={Priority.High}>{t.priorityHigh}</option>
                      <option value={Priority.Urgent}>{t.priorityUrgent}</option>
                    </select>
                  )}

                  {filter.type === 'tags' && (
                    <select
                      value={filterTagId ?? ''}
                      onChange={(e) => setFilterTagId(Number(e.target.value))}
                      className="rule-select"
                    >
                      {availableTags.length === 0 ? (
                        <option value="">{t.noTagsFound}</option>
                      ) : (
                        availableTags.map((tag) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name.toUpperCase()}
                          </option>
                        ))
                      )}
                    </select>
                  )}

                  {filter.type === 'name' && (
                    <input
                      type="text"
                      value={filterQuery.trim()}
                      placeholder={t.searchQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="rule-input"
                      autoFocus
                    />
                  )}
                </div>

                <button
                  className="rule-delete-btn"
                  onClick={() => handleRemoveFilter(filter.type)}
                  title="Remove filter"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="filter-popover-footer">
        <div className="add-filter-container">
          <button
            className="select-filter-trigger"
            onClick={() => setShowAddMenu(!showAddMenu)}
            disabled={addableTypes.length === 0}
          >
            <span>{addableTypes.length === 0 ? t.allFiltersAdded : t.selectFilter}</span>
            <ChevronDown size={14} />
          </button>
          
          {showAddMenu && addableTypes.length > 0 && (
            <div className="add-filter-dropdown">
              {addableTypes.map((item) => (
                <button
                  key={item.type}
                  className="dropdown-item"
                  onClick={() => handleAddFilter(item.type)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
