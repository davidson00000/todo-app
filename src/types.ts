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
    milestone_id?: string;
    dependencies?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface TaskDependency {
    id: string;
    blocking_task_id: string;
    dependent_task_id: string;
    created_at: string;
}

export interface Milestone {
    id: string;
    project_id: string;
    title: string;
    deliverables?: string;
    start_date?: string;
    due_date?: string;
    created_at?: string;
    tasks?: Task[];
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

export interface UserProfile {
    id: string;
    display_name?: string;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Canvas {
    id: string;
    user_id: string;
    name: string;
    type?: 'canvas' | 'mindmap'; // Type of canvas
    data?: any; // Legacy
    nodes?: any;
    edges?: any;
    settings?: any;
    nextId?: number;
    created_at: string;
    updated_at: string;
}
