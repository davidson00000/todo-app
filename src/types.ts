export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
    id: string;
    title: string;
    project: string;
    due: string;
    priority: TaskPriority;
    status: TaskStatus;
}
