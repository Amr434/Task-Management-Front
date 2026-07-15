"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getAssignedTasks } from '@/features/tasks/api';
import { TaskItem } from '@/features/tasks/types';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { useColumnGridTemplate } from '@/features/tasks/hooks/useColumnGridTemplate';
import { useSpaceStore } from '@/store/useSpaceStore';

export default function AssignedToMePage() {
  const tasks = useSpaceStore((s) => s.assignedTasks);
  const setAssignedTasks = useSpaceStore((s) => s.setAssignedTasks);
  const [loading, setLoading] = useState(true);
  
  const visibleColumns = useSpaceStore((s) => s.visibleColumns);
  const gridTemplateColumns = useColumnGridTemplate();

  useEffect(() => {
    getAssignedTasks()
      .then(data => setAssignedTasks(data))
      .catch(err => console.error("Failed to fetch assigned tasks", err))
      .finally(() => setLoading(false));
  }, [setAssignedTasks]);

  const { rootTasks, childrenByParent } = useMemo(() => {
    const byParent: Record<number, TaskItem[]> = {};
    const root: TaskItem[] = [];
    
    tasks.forEach(task => {
      if (task.parentTaskId) {
        if (!byParent[task.parentTaskId]) byParent[task.parentTaskId] = [];
        byParent[task.parentTaskId].push(task);
      }
    });
    
    tasks.forEach(task => {
      // If a task has no parent, or its parent is not in this list (e.g. parent wasn't assigned to me), treat it as a root task
      if (!task.parentTaskId || !tasks.find(t => t.id === task.parentTaskId)) {
        root.push(task);
      }
    });
    
    return { rootTasks: root, childrenByParent: byParent };
  }, [tasks]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Assigned to me</h1>
      </div>
      
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <p>Tasks assigned to you will appear here.</p>
          </div>
        ) : (
          <div className="list-tasks-container">
            <div className="table-header" style={{ gridTemplateColumns }}>
              <div className="th-cell th-name">Name</div>
              {visibleColumns.assignee && <div className="th-cell th-assignee">Assignee</div>}
              {visibleColumns.dueDate && <div className="th-cell th-due">Due date</div>}
              {visibleColumns.priority && <div className="th-cell th-priority">Priority</div>}
            </div>

            {rootTasks.map((task) => (
              <TaskRow 
                key={task.id} 
                task={task} 
                childrenByParent={childrenByParent} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
