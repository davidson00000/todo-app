import React, { useState } from 'react';
import { Plus, Calendar, Target, Trash2, ChevronLeft, ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react';
import type { Project, Milestone, Task } from '../types';
import { AddTaskModal } from '../components/AddTaskModal';

interface RoadmapProps {
    projects: Project[];
    milestones: Milestone[];
    tasks: Task[];
    onAddMilestone: (milestone: Omit<Milestone, 'id' | 'created_at'>) => Promise<void>;
    onDeleteMilestone: (id: string) => Promise<void>;
    onSaveTask: (task: any) => Promise<void>;
    onRefreshTasks: () => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({
    projects,
    milestones,
    tasks,
    onAddMilestone,
    onDeleteMilestone,
    onSaveTask,
    onRefreshTasks,
}) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        projects.length > 0 ? projects[0].id : null
    );
    const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
    const [isListOpen, setIsListOpen] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // View mode: 'detailed' shows all content expanded, 'compact' hides tasks by default
    const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');

    // Track which milestones are expanded (keyed by milestone ID)
    const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

    const [newMilestone, setNewMilestone] = useState({
        title: '',
        deliverables: '',
        start_date: '',
        due_date: '',
    });

    // Helper to check if a milestone is expanded
    const isMilestoneExpanded = (milestoneId: string) => {
        // If not explicitly set, default based on view mode
        if (expandedMilestones[milestoneId] === undefined) {
            return viewMode === 'detailed';
        }
        return expandedMilestones[milestoneId];
    };

    // Toggle a specific milestone
    const toggleMilestone = (milestoneId: string) => {
        setExpandedMilestones(prev => ({
            ...prev,
            [milestoneId]: !isMilestoneExpanded(milestoneId)
        }));
    };

    // Handle view mode change
    const handleViewModeChange = (mode: 'detailed' | 'compact') => {
        setViewMode(mode);
        // Reset all milestone states to follow the new mode
        setExpandedMilestones({});
    };

    const selectedProject = projects.find((p) => p.id === selectedProjectId);
    const projectMilestones = milestones.filter((m) => m.project_id === selectedProjectId);

    const handleAddMilestone = async () => {
        if (!selectedProjectId || !newMilestone.title) return;

        await onAddMilestone({
            project_id: selectedProjectId,
            title: newMilestone.title,
            deliverables: newMilestone.deliverables,
            start_date: newMilestone.start_date || undefined,
            due_date: newMilestone.due_date || undefined,
        });

        setNewMilestone({ title: '', deliverables: '', start_date: '', due_date: '' });
        setIsAddMilestoneOpen(false);
    };

    const getMilestoneTasks = (milestone: Milestone) => {
        // Use tasks from the milestone object if available (from join query)
        // Otherwise fall back to filtering from props
        return milestone.tasks || tasks.filter((t) => t.milestone_id === milestone.id);
    };

    return (
        <div className="h-full flex overflow-hidden bg-gray-50 dark:bg-slate-950">
            {/* Left Pane: Project List (Collapsible) */}
            <div
                className={`bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-all duration-300 overflow-hidden ${isListOpen ? 'w-64' : 'w-0'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 min-w-64">
                    <p className="text-xs text-gray-500 dark:text-slate-500">Select a project</p>
                    <button
                        onClick={() => setIsListOpen(false)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Hide project list"
                    >
                        <ChevronLeft size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-w-64">
                    {projects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => setSelectedProjectId(project.id)}
                            className={`w-full text-left p-4 rounded-lg transition-all ${selectedProjectId === project.id
                                ? 'bg-cyan-500/10 border-2 border-cyan-500/50'
                                : 'bg-gray-100 dark:bg-slate-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: project.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                        {project.name}
                                    </h3>
                                    {project.deadline && (
                                        <p className="text-xs text-gray-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                                            <Calendar size={12} />
                                            {new Date(project.deadline).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Pane: Milestone Planning Board */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {!isListOpen && (
                                <button
                                    onClick={() => setIsListOpen(true)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-slate-400 hover:text-cyan-400 transition-colors"
                                    title="Show project list"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-cyan-400">
                                    {selectedProject ? selectedProject.name : 'Select a Project'}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                                    {projectMilestones.length} milestone(s)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-2 bg-gray-200 dark:bg-slate-800 rounded-lg p-1">
                                <button
                                    onClick={() => handleViewModeChange('detailed')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'detailed'
                                        ? 'bg-cyan-500 text-white'
                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Eye size={16} className="inline mr-1.5" />
                                    Detailed
                                </button>
                                <button
                                    onClick={() => handleViewModeChange('compact')}
                                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'compact'
                                        ? 'bg-cyan-500 text-white'
                                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <EyeOff size={16} className="inline mr-1.5" />
                                    Compact
                                </button>
                            </div>

                            {selectedProject && (
                                <button
                                    onClick={() => setIsAddMilestoneOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                                >
                                    <Plus size={18} />
                                    Add Milestone
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!selectedProject ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-600 dark:text-slate-500">Select a project to view its roadmap</p>
                        </div>
                    ) : projectMilestones.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Target size={48} className="text-gray-400 dark:text-slate-700 mb-4" />
                            <p className="text-gray-600 dark:text-slate-500">No milestones yet. Create one to get started!</p>
                        </div>
                    ) : (
                        projectMilestones.map((milestone) => {
                            const milestoneTasks = getMilestoneTasks(milestone);
                            const isExpanded = isMilestoneExpanded(milestone.id);

                            return (
                                <div
                                    key={milestone.id}
                                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden"
                                >
                                    {/* Collapsible Header */}
                                    <div
                                        className="flex items-start justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                                        onClick={() => toggleMilestone(milestone.id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {milestone.title}
                                                </h3>
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-400">
                                                    {milestoneTasks.length} {milestoneTasks.length === 1 ? 'task' : 'tasks'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
                                                {milestone.start_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {new Date(milestone.start_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {milestone.due_date && (
                                                    <span className="flex items-center gap-1">
                                                        → {new Date(milestone.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteMilestone(milestone.id);
                                                }}
                                                className="text-gray-500 dark:text-slate-500 hover:text-red-400 dark:hover:text-red-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="text-gray-600 dark:text-slate-400 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Collapsible Content */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 space-y-4">
                                            {milestone.deliverables && (
                                                <div className="p-4 bg-gray-100 dark:bg-slate-950 rounded-lg">
                                                    <h4 className="text-xs font-semibold text-cyan-400 mb-2">
                                                        DELIVERABLES
                                                    </h4>
                                                    <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                                                        {milestone.deliverables}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-semibold text-gray-600 dark:text-slate-400">
                                                        TASKS ({milestoneTasks.length})
                                                    </h4>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Create new task template with milestone and project pre-filled
                                                            const newTask: Task = {
                                                                id: '',
                                                                title: '',
                                                                project: selectedProject?.name || '',
                                                                status: 'todo',
                                                                priority: 'medium',
                                                                due_date: '',
                                                                milestone_id: milestone.id,
                                                            };
                                                            setEditingTask(newTask);
                                                            setIsTaskModalOpen(true);
                                                        }}
                                                        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                                                    >
                                                        <Plus size={14} />
                                                        Add Task
                                                    </button>
                                                </div>
                                                {milestoneTasks.map((task) => (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => {
                                                            setEditingTask(task);
                                                            setIsTaskModalOpen(true);
                                                        }}
                                                        className="p-3 bg-gray-100 dark:bg-slate-950 rounded border border-gray-300 dark:border-slate-800 hover:border-cyan-500/30 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`w-2 h-2 rounded-full ${task.status === 'done'
                                                                    ? 'bg-green-500'
                                                                    : task.status === 'in-progress'
                                                                        ? 'bg-cyan-500'
                                                                        : 'bg-gray-400 dark:bg-slate-600'
                                                                    }`}
                                                            />
                                                            <span className={`text-sm text-gray-900 dark:text-white ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Add Milestone Modal */}
            {isAddMilestoneOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 w-full max-w-lg border border-gray-200 dark:border-slate-800">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4">Add Milestone</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={newMilestone.title}
                                    onChange={(e) =>
                                        setNewMilestone({ ...newMilestone, title: e.target.value })
                                    }
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                                    placeholder="e.g., MVP Release"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-2">
                                    Deliverables
                                </label>
                                <textarea
                                    value={newMilestone.deliverables}
                                    onChange={(e) =>
                                        setNewMilestone({ ...newMilestone, deliverables: e.target.value })
                                    }
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                                    rows={4}
                                    placeholder="Define key deliverables for this milestone..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newMilestone.start_date}
                                        onChange={(e) =>
                                            setNewMilestone({ ...newMilestone, start_date: e.target.value })
                                        }
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-2">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newMilestone.due_date}
                                        onChange={(e) =>
                                            setNewMilestone({ ...newMilestone, due_date: e.target.value })
                                        }
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsAddMilestoneOpen(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMilestone}
                                disabled={!newMilestone.title}
                                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
                            >
                                Create Milestone
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Task Modal */}
            <AddTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
                }}
                onSave={onSaveTask}
                initialTask={editingTask}
                projects={projects}
                milestones={milestones}
                onRefresh={async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    onRefreshTasks();
                }}
            />
        </div>
    );
};
