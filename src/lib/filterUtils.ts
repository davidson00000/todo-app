import type { Task } from '../types';

export type DueDateFilter = 'all' | 'overdue' | 'today' | 'this-week' | 'this-month' | 'no-date';
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
export type StatusFilter = 'all' | 'todo' | 'in-progress' | 'done';

export interface TaskFilters {
    searchQuery: string;
    project: string;
    dueDate: DueDateFilter;
    priority: PriorityFilter;
    status: StatusFilter;
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter(task => {
        // 1. Search filter (title or description)
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesTitle = task.title.toLowerCase().includes(query);
            const matchesDescription = task.description?.toLowerCase().includes(query) || false;
            if (!matchesTitle && !matchesDescription) return false;
        }

        // 2. Project filter
        if (filters.project !== 'all' && task.project !== filters.project) {
            return false;
        }

        // 3. Priority filter
        if (filters.priority !== 'all' && task.priority !== filters.priority) {
            return false;
        }

        // 4. Status filter
        if (filters.status !== 'all') {
            const statusMap: Record<StatusFilter, string> = {
                'all': '',
                'todo': 'todo',
                'in-progress': 'in-progress',
                'done': 'done'
            };
            if (task.status !== statusMap[filters.status]) return false;
        }

        // 5. Due date filter
        if (filters.dueDate !== 'all') {
            if (!dueDateMatches(task, filters.dueDate)) return false;
        }

        return true;
    });
}

function dueDateMatches(task: Task, filter: DueDateFilter): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'no-date') {
        return !task.due_date;
    }

    if (!task.due_date) return false;

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);

    switch (filter) {
        case 'overdue':
            return dueDate < today && task.status !== 'done';

        case 'today':
            return dueDate.getTime() === today.getTime();

        case 'this-week':
            const weekStart = getMonday(today);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            return dueDate >= weekStart && dueDate <= weekEnd;

        case 'this-month':
            return dueDate.getMonth() === today.getMonth() &&
                dueDate.getFullYear() === today.getFullYear();

        default:
            return true;
    }
}

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}
