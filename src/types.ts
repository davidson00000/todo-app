export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Subtask {
    id: string;
    task_id: string;
    title: string;
    is_completed: boolean;
    due_date?: string;
    created_at?: string;
}

export interface Attachment {
    id: string;
    task_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    created_at: string;
}

export interface Task {
    id: string;
    title: string;
    project: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    start_date?: string;
    description?: string;
    subtasks?: Subtask[];
    attachments?: Attachment[];
}

export interface Project {
    id: string;
    name: string;
    color: string;
    deadline?: string;
    status?: 'Planning' | 'Active' | 'Completed' | 'On Hold';
    priority?: 'High' | 'Medium' | 'Low';
    scope?: string;
    goal?: string;
}
