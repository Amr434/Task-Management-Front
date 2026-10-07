import { getTasksByProject } from '@task/core/features/tasks/api';
import { useSpaceStore } from '@task/core/store/useSpaceStore';

/**
 * Opens a task's detail panel from anywhere (a pop-up, the notification
 * list), loading its project's tasks into the store first if needed.
 * reload: fetch them even if loaded, because the stored copy is out of date.
 */
export async function openTaskDetail(taskId: number, projectId: number, reload = false) {
  const { tasksByProjectId, setTasksForProject, setDetailTaskId } = useSpaceStore.getState();
  try {
    if (reload || !tasksByProjectId[projectId]?.some((tk) => tk.id === taskId)) {
      setTasksForProject(projectId, await getTasksByProject(projectId));
    }
    setDetailTaskId(taskId);
  } catch (e) {
    console.warn('Failed to open task', e instanceof Error ? e.message : String(e));
  }
}
