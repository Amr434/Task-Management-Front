"use client";

import React, { useEffect, useState } from 'react';
import { getListsByProject } from '@/features/lists/api/getLists';
import { getTasksByList } from '@/features/tasks/api/getTasks';
import { List } from '@/features/lists/types';
import { TaskItem } from '@/features/tasks/types';
import { Plus } from 'lucide-react';

export const ProjectBoard = ({ projectId }: { projectId: number }) => {
  const [lists, setLists] = useState<List[]>([]);
  const [tasksByList, setTasksByList] = useState<Record<number, TaskItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all lists for this project
        const fetchedLists = await getListsByProject(projectId);
        setLists(fetchedLists);

        // Fetch tasks for all lists concurrently
        const tasksData: Record<number, TaskItem[]> = {};
        await Promise.all(
          fetchedLists.map(async (list) => {
            const tasks = await getTasksByList(list.id);
            tasksData[list.id] = tasks;
          })
        );
        setTasksByList(tasksData);
      } catch (error) {
        console.error("Failed to load project board", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (isLoading) {
    return <div style={{ padding: '24px' }}>Loading board...</div>;
  }

  return (
    <div className="project-board">
      <header className="board-header">
        <h1>Project Board</h1>
      </header>
      <div className="columns-container">
        {lists.map(list => (
          <div key={list.id} className="list-column">
            <div className="list-header">
              <h3>{list.name} <span className="task-count">{tasksByList[list.id]?.length || 0}</span></h3>
              <button className="icon-btn"><Plus size={16} /></button>
            </div>
            
            <div className="task-list">
              {(!tasksByList[list.id] || tasksByList[list.id].length === 0) && (
                <div className="empty-task">No tasks</div>
              )}
              {tasksByList[list.id]?.map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-title">{task.title}</div>
                  {task.description && <div className="task-desc">{task.description}</div>}
                  <div className="task-meta">
                    {/* Assuming PriorityLevel maps to ints 0-4 */}
                    <span className={`priority p-${task.priority}`}>P{task.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="add-list-column">
          <button className="add-list-btn"><Plus size={16} /> Add List</button>
        </div>
      </div>
    </div>
  );
};
