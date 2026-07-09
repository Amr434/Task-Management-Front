import { create } from 'zustand';
import { Space } from '@/features/spaces/types';
import { Project } from '@/features/projects/types';
import { TaskItem, Priority, TaskStatus } from '@/features/tasks/types';
import { getTasksByProject } from '@/features/tasks/api';
import apiClient from '@/services/apiClient';

export type GroupBy = 'status' | 'assignee' | 'priority' | 'tags' | 'dueDate' | 'none';
export type GroupDir = 'asc' | 'desc';

// List-view columns that the "Customize" popover can show/hide.
export type TaskColumn = 'assignee' | 'dueDate' | 'priority' | 'tags';

interface SpaceState {
  space: Space | null;
  projects: Project[];
  tasksByProjectId: Record<number, TaskItem[]>;
  isLoading: boolean;
  detailTaskId: number | null;

  // List-view grouping controls.
  groupBy: GroupBy;
  groupDir: GroupDir;
  setGroupBy: (groupBy: GroupBy) => void;
  setGroupDir: (dir: GroupDir) => void;

  // Filters state.
  filterQuery: string;
  showClosed: boolean;
  filterPriority: Priority | null;
  filterStatus: TaskStatus | null;
  filterTagId: number | null;
  filterAssigneeId: number | null;
  setFilterQuery: (query: string) => void;
  setShowClosed: (showClosed: boolean) => void;
  setFilterPriority: (priority: Priority | null) => void;
  setFilterStatus: (status: TaskStatus | null) => void;
  setFilterTagId: (tagId: number | null) => void;
  setFilterAssigneeId: (userId: number | null) => void;
  clearFilters: () => void;

  // List-view column visibility ("Customize" popover).
  visibleColumns: Record<TaskColumn, boolean>;
  toggleColumn: (col: TaskColumn) => void;

  fetchSpaceData: (spaceId: number) => Promise<void>;
  addTaskLocally: (task: TaskItem) => void;
  updateTaskLocally: (taskId: number, patch: Partial<TaskItem>) => void;
  deleteTaskLocally: (taskId: number) => void;

  setTasksForProject: (projectId: number, tasks: TaskItem[]) => void;
  setProjectLocally: (project: Project) => void;

  setDetailTaskId: (taskId: number | null) => void;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  space: null,
  projects: [],
  tasksByProjectId: {},
  isLoading: true,
  detailTaskId: null,

  groupBy: 'status',
  groupDir: 'asc',
  setGroupBy: (groupBy) => set({ groupBy }),
  setGroupDir: (dir) => set({ groupDir: dir }),

  // Filters initial state
  filterQuery: '',
  showClosed: false,
  filterPriority: null,
  filterStatus: null,
  filterTagId: null,
  filterAssigneeId: null,
  setFilterQuery: (query) => set({ filterQuery: query }),
  setShowClosed: (showClosed) => set({ showClosed }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterTagId: (tagId) => set({ filterTagId: tagId }),
  setFilterAssigneeId: (userId) => set({ filterAssigneeId: userId }),
  clearFilters: () => set({ filterQuery: '', showClosed: false, filterPriority: null, filterStatus: null, filterTagId: null, filterAssigneeId: null }),

  // Column visibility initial state — all columns shown.
  visibleColumns: { assignee: true, dueDate: true, priority: true, tags: true },
  toggleColumn: (col) => set((state) => ({
    visibleColumns: { ...state.visibleColumns, [col]: !state.visibleColumns[col] },
  })),

  setDetailTaskId: (taskId) => set({ detailTaskId: taskId }),

  setTasksForProject: (projectId: number, tasks: TaskItem[]) => {
    set((state) => ({
      tasksByProjectId: {
        ...state.tasksByProjectId,
        [projectId]: tasks,
      }
    }));
  },

  setProjectLocally: (project: Project) => {
    set((state) => {
      const exists = state.projects.find(p => p.id === project.id);
      if (exists) {
        return {
          projects: state.projects.map(p => p.id === project.id ? project : p)
        };
      }
      return {
        projects: [...state.projects, project]
      };
    });
  },

  fetchSpaceData: async (spaceId: number) => {
    try {
      set({ isLoading: true });
      const spaces = await apiClient.get<any, Space[]>('/Spaces');
      const foundSpace = spaces.find(s => s.id === spaceId) || null;
      
      const fetchedProjects = await apiClient.get<any, Project[]>(`/Projects/space/${spaceId}`);
      
      const tasksMap: Record<number, TaskItem[]> = {};
      for (const project of fetchedProjects) {
        tasksMap[project.id] = await getTasksByProject(project.id);
      }

      set({
        space: foundSpace,
        projects: fetchedProjects,
        tasksByProjectId: tasksMap,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load space data", error);
      set({ isLoading: false });
    }
  },

  addTaskLocally: (task: TaskItem) => {
    set((state) => {
      const pid = task.projectId;
      const tasks = state.tasksByProjectId[pid] || [];
      return {
        tasksByProjectId: {
          ...state.tasksByProjectId,
          [pid]: [...tasks, task],
        }
      };
    });
  },

  updateTaskLocally: (taskId: number, patch: Partial<TaskItem>) => {
    set((state) => {
      const newTasksByProject = { ...state.tasksByProjectId };
      let found = false;
      
      for (const pidStr in newTasksByProject) {
        const pid = parseInt(pidStr);
        const tasks = newTasksByProject[pid];
        const taskIdx = tasks.findIndex(t => t.id === taskId);
        
        if (taskIdx !== -1) {
          const oldTask = tasks[taskIdx];
          const updatedTask = { ...oldTask, ...patch };
          
          const newTasks = [...tasks];
          newTasks[taskIdx] = updatedTask;
          
          newTasksByProject[pid] = newTasks;
          found = true;
          break;
        }
      }
      
      return found ? { tasksByProjectId: newTasksByProject } : state;
    });
  },

  deleteTaskLocally: (taskId: number) => {
    set((state) => {
      const newTasksByProject = { ...state.tasksByProjectId };
      let found = false;
      
      for (const pidStr in newTasksByProject) {
        const pid = parseInt(pidStr);
        const tasks = newTasksByProject[pid];
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        
        if (filteredTasks.length !== tasks.length) {
          newTasksByProject[pid] = filteredTasks;
          found = true;
        }
      }
      
      return found ? { tasksByProjectId: newTasksByProject } : state;
    });
  }
}));
