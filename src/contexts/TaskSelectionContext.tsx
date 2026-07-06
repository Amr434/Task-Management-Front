"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TaskSelectionContextType {
  selectedTaskIds: number[];
  toggleTaskSelection: (taskId: number) => void;
  clearSelection: () => void;
  selectAll: (taskIds: number[]) => void;
}

const TaskSelectionContext = createContext<TaskSelectionContextType | undefined>(undefined);

export const TaskSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const clearSelection = () => {
    setSelectedTaskIds([]);
  };

  const selectAll = (taskIds: number[]) => {
    setSelectedTaskIds(taskIds);
  };

  return (
    <TaskSelectionContext.Provider value={{ selectedTaskIds, toggleTaskSelection, clearSelection, selectAll }}>
      {children}
    </TaskSelectionContext.Provider>
  );
};

export const useTaskSelection = () => {
  const context = useContext(TaskSelectionContext);
  if (context === undefined) {
    throw new Error('useTaskSelection must be used within a TaskSelectionProvider');
  }
  return context;
};
