"use client";

import React, { useState } from 'react';
import { Plus, Flag, Calendar } from 'lucide-react';
import { TaskItem, priorityMeta, TaskStatus } from '../types';

interface BoardViewProps {
  tasks: TaskItem[];
  onMoveTask: (taskId: number, toStatus: TaskStatus) => void;
  onAddTask: (status: TaskStatus) => void;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.ToDo: return '#87909e';
    case TaskStatus.InProgress: return '#2684ff';
    case TaskStatus.Complete: return '#00c875';
    default: return '#7b68ee';
  }
};

const getStatusName = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.ToDo: return 'TO DO';
    case TaskStatus.InProgress: return 'IN PROGRESS';
    case TaskStatus.Complete: return 'COMPLETE';
    default: return 'UNKNOWN';
  }
};

const TaskCard: React.FC<{ task: TaskItem }> = ({ task }) => {
  const priority = priorityMeta(task.priority);
  return (
    <div
      className="board-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/task-id', String(task.id));
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <div className="board-card-title">{task.title}</div>
      <div className="board-card-meta">
        <span className="board-card-priority" title={priority.label}>
          <Flag size={13} style={{ color: priority.color }} />
        </span>
        {task.dueDate && (
          <span className="board-card-due">
            <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

export const BoardView: React.FC<BoardViewProps> = ({ tasks, onMoveTask, onAddTask }) => {
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const statuses = [TaskStatus.ToDo, TaskStatus.InProgress, TaskStatus.Complete];

  return (
    <div className="board-view">
      {statuses.map((status) => {
        const columnTasks = tasks.filter(t => t.status === status);
        const color = getStatusColor(status);
        const name = getStatusName(status);
        
        return (
          <div
            key={status}
            className={`board-column ${dragOverStatus === status ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
            onDragLeave={() => setDragOverStatus((cur) => (cur === status ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverStatus(null);
              const taskId = parseInt(e.dataTransfer.getData('text/task-id'), 10);
              if (!isNaN(taskId)) onMoveTask(taskId, status);
            }}
          >
            <div className="board-column-header">
              <span className="board-column-badge" style={{ backgroundColor: color }}>
                {name}
              </span>
              <span className="board-column-count">{columnTasks.length}</span>
            </div>

            <div className="board-column-body">
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>

            <button className="board-add-card" onClick={() => onAddTask(status)}>
              <Plus size={14} /> Add Task
            </button>
          </div>
        );
      })}
    </div>
  );
};
