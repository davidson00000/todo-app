import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, Trash2, Plus, Upload, File, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { Task, TaskPriority, TaskStatus, Project, Subtask, Attachment, Milestone } from '../types';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: { title: string; project: string; due_date: string; start_date?: string; description?: string; priority: TaskPriority; status: TaskStatus; milestone_id?: string | null; subtasks?: Omit<Subtask, 'id' | 'task_id' | 'created_at'>[]; dependencies?: string[] }) => void;
    initialTask?: Task | null;
    projects: Project[];
    milestones: Milestone[];
    tasks?: Task[];
    onRefresh?: () => void | Promise<void>;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialTask,
    projects = [],
    milestones = [],
    tasks = [],
    onRefresh
}) => {
    // ... existing state ...
    const [title, setTitle] = useState('');
    const [project, setProject] = useState('');
    const [startDateStr, setStartDateStr] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [status, setStatus] = useState<TaskStatus>('todo');
    const [description, setDescription] = useState('');
    const [milestoneId, setMilestoneId] = useState<string>('');

    // Subtasks state
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newSubtaskDate, setNewSubtaskDate] = useState('');

    // Attachments state
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const [blockingTaskIds, setBlockingTaskIds] = useState<string[]>([]);

    // ... existing useEffect ...
    useEffect(() => {
        if (isOpen) {
            if (initialTask) {
                setTitle(initialTask.title);
                setProject(initialTask.project);
                // ... existing date parsing ...
                // Dates are stored as YYYY-MM-DD; set directly
                setDateStr(initialTask.due_date ?? '');
                setStartDateStr(initialTask.start_date ?? '');
                setPriority(initialTask.priority);
                setStatus(initialTask.status);
                setDescription(initialTask.description || '');
                setSubtasks(initialTask.subtasks || []);
                setAttachments(initialTask.attachments || []);
                setMilestoneId(initialTask.milestone_id || '');
                setBlockingTaskIds(initialTask.dependencies || []);
            } else {
                // Reset form
                setTitle('');
                setProject(projects.length > 0 ? projects[0].name : '');
                setDateStr('');
                setStartDateStr('');
                setPriority('medium');
                setStatus('todo');
                setDescription('');
                setSubtasks([]);
                setAttachments([]);
                setMilestoneId('');
                setBlockingTaskIds([]);
            }
        }
    }, [isOpen, initialTask, projects]);

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;

        if (initialTask) {
            // Add to existing task via Supabase
            const { data, error } = await supabase
                .from('subtasks')
                .insert([{
                    task_id: initialTask.id,
                    title: newSubtaskTitle.trim(),
                    is_completed: false,
                    due_date: newSubtaskDate || null
                }])
                .select()
                .single();

            if (error) {
                console.error('Error adding subtask:', error);
            } else if (data) {
                setSubtasks([...subtasks, data]);
                setNewSubtaskTitle('');
                setNewSubtaskDate('');
            }
        } else {
            // Add to local state for new task
            const newSubtask: Subtask = {
                id: crypto.randomUUID(),
                task_id: '', // Will be set when task is created
                title: newSubtaskTitle.trim(),
                is_completed: false,
                due_date: newSubtaskDate || undefined
            };
            setSubtasks([...subtasks, newSubtask]);
            setNewSubtaskTitle('');
            setNewSubtaskDate('');
        }
    };

    const handleToggleSubtask = async (subtask: Subtask) => {
        const newCompleted = !subtask.is_completed;

        if (initialTask && !subtask.id.startsWith('temp-')) {
            // Immediate update for existing task
            const { error } = await supabase
                .from('subtasks')
                .update({ is_completed: newCompleted })
                .eq('id', subtask.id);

            if (error) {
                console.error('Error updating subtask:', error);
                alert('Failed to update subtask');
            } else {
                setSubtasks(subtasks.map(s => s.id === subtask.id ? { ...s, is_completed: newCompleted } : s));
                // Recalculate parent task status based on all subtasks
                const { data: parentSubtasks, error: subErr } = await supabase
                    .from('subtasks')
                    .select('is_completed')
                    .eq('task_id', initialTask.id);
                if (!subErr && parentSubtasks) {
                    const allDone = parentSubtasks.every((s: any) => s.is_completed);
                    await supabase
                        .from('tasks')
                        .update({ status: allDone ? 'done' : 'in-progress' })
                        .eq('id', initialTask.id);
                    onRefresh?.();
                }
            }
        } else {
            // Local update for new task (will be saved on final submit)
            setSubtasks(subtasks.map(s => s.id === subtask.id ? { ...s, is_completed: newCompleted } : s));
        }
    };

    const handleDeleteSubtask = async (subtaskId: string) => {
        if (initialTask && !subtaskId.startsWith('temp-')) {
            // Immediate delete for existing task
            const { error } = await supabase
                .from('subtasks')
                .delete()
                .eq('id', subtaskId);

            if (error) {
                console.error('Error deleting subtask:', error);
                alert('Failed to delete subtask');
            } else {
                setSubtasks(subtasks.filter(s => s.id !== subtaskId));
            }
        } else {
            // Local delete
            setSubtasks(subtasks.filter(s => s.id !== subtaskId));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!initialTask) {
            alert("Please save the task first before adding attachments.");
            return;
        }

        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `tasks/${initialTask.id}/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(filePath);

            // 3. Save to DB
            const { data: attachmentData, error: dbError } = await supabase
                .from('attachments')
                .insert([{
                    task_id: initialTask.id,
                    file_name: file.name,
                    file_url: publicUrl,
                    file_type: file.type
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            if (attachmentData) {
                setAttachments([...attachments, attachmentData]);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDeleteAttachment = async (attachment: Attachment) => {
        if (!confirm('Are you sure you want to delete this attachment?')) return;

        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('attachments')
                .delete()
                .eq('id', attachment.id);

            if (dbError) throw dbError;

            // 2. Delete from Storage (extract path from URL or store path in DB ideally, but here we try to reconstruct or just leave it if complex)
            // For now, we'll just remove from DB and UI as per common pattern if path isn't readily available.
            // But we can try to parse the path from the URL if it follows standard Supabase format.
            // URL: .../storage/v1/object/public/task-attachments/tasks/{task_id}/{filename}
            const urlObj = new URL(attachment.file_url);
            const pathParts = urlObj.pathname.split('/task-attachments/');
            if (pathParts.length > 1) {
                const storagePath = pathParts[1];
                const { error: storageError } = await supabase.storage
                    .from('task-attachments')
                    .remove([storagePath]);
                if (storageError) console.warn('Failed to delete file from storage', storageError);
            }

            setAttachments(attachments.filter(a => a.id !== attachment.id));
        } catch (error) {
            console.error('Error deleting attachment:', error);
            alert('Failed to delete attachment.');
        }
    };

    // ... existing handleSubmit ...
    const [isSaving, setIsSaving] = useState(false);

    // ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dateStr) return;

        setIsSaving(true);
        try {
            // Debug log as requested
            console.log('Saving Task - Selected Milestone:', milestoneId);

            // Explicitly handle milestone_id logic
            // If milestoneId is empty string or "no_milestone" (though we use empty string for that), send null
            const finalMilestoneId = (!milestoneId || milestoneId === "no_milestone") ? null : milestoneId;

            const payload = {
                title,
                project,
                due_date: dateStr, // raw YYYY-MM-DD
                start_date: startDateStr || undefined,
                description: description || undefined,
                priority,
                status,
                milestone_id: finalMilestoneId,
                subtasks: subtasks.map(s => ({ title: s.title, is_completed: s.is_completed, due_date: s.due_date })),
                dependencies: blockingTaskIds
            };

            console.log('Final Payload to Supabase:', payload);

            await onSave(payload);
            if (onRefresh) {
                await onRefresh();
            }
            onClose();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto border border-gray-100 dark:border-gray-700 flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {initialTask ? 'Edit Task' : 'New Task'}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Title Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Task Title
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="What needs to be done?"
                                        required
                                    />
                                </div>

                                {/* Project & Milestone Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Project
                                        </label>
                                        <select
                                            value={project}
                                            onChange={(e) => setProject(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                            required
                                        >
                                            <option value="" disabled>Select Project</option>
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.name}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Milestone
                                        </label>
                                        <select
                                            value={milestoneId}
                                            onChange={(e) => setMilestoneId(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                        >
                                            <option value="">No Milestone</option>
                                            {milestones
                                                .filter(m => !project || milestones.find(ms => ms.id === m.id)?.project_id === projects.find(p => p.name === project)?.id)
                                                .map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.title}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Dates & Priority */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDateStr}
                                            onChange={(e) => setStartDateStr(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateStr}
                                            onChange={(e) => setDateStr(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Priority
                                        </label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                        placeholder="Add details about this task..."
                                    />
                                </div>

                                {/* Dependencies Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Blocking Tasks (Dependencies)
                                    </label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
                                        {tasks?.filter(t => t.id !== initialTask?.id).map(task => (
                                            <label key={task.id} className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={blockingTaskIds.includes(task.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setBlockingTaskIds([...blockingTaskIds, task.id]);
                                                        } else {
                                                            setBlockingTaskIds(blockingTaskIds.filter(id => id !== task.id));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                    {task.title} <span className="text-xs text-gray-400">({task.status})</span>
                                                </span>
                                            </label>
                                        ))}
                                        {(!tasks || tasks.length === 0) && (
                                            <p className="text-xs text-gray-500 text-center py-2">No other tasks available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Checklist Section */}
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Checklist</label>

                                    <div className="space-y-2 mb-3">
                                        {subtasks.map((subtask) => (
                                            <div key={subtask.id} className="flex items-center gap-2 group">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSubtask(subtask)}
                                                    className={cn(
                                                        "text-gray-400 hover:text-cyan-400 transition-colors",
                                                        subtask.is_completed && "text-cyan-400"
                                                    )}
                                                >
                                                    {subtask.is_completed ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                                <span className={cn(
                                                    "flex-1 text-sm text-gray-700 dark:text-gray-300 transition-all",
                                                    subtask.is_completed && "line-through text-gray-400 dark:text-gray-500"
                                                )}>
                                                    {subtask.title}
                                                </span>
                                                {subtask.due_date && (
                                                    <span className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full",
                                                        new Date(subtask.due_date) < new Date() && !subtask.is_completed
                                                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                                    )}>
                                                        {new Date(subtask.due_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSubtask(subtask.id)}
                                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                                            placeholder="Add a subtask..."
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                                        />
                                        <input
                                            type="date"
                                            value={newSubtaskDate}
                                            onChange={(e) => setNewSubtaskDate(e.target.value)}
                                            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSubtask}
                                            disabled={!newSubtaskTitle.trim()}
                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Attachments Section */}
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</label>

                                    <div className="space-y-2 mb-3">
                                        {attachments.map((attachment) => (
                                            <div key={attachment.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg group border border-gray-100 dark:border-gray-700">
                                                <div className="p-2 bg-white dark:bg-gray-600 rounded-md shadow-sm">
                                                    <File size={16} className="text-cyan-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <a
                                                        href={attachment.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-cyan-500 dark:hover:text-blue-400 truncate block flex items-center gap-1"
                                                    >
                                                        {attachment.file_name}
                                                        <ExternalLink size={12} className="opacity-50" />
                                                    </a>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(attachment.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteAttachment(attachment)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {initialTask ? (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                disabled={isUploading}
                                            />
                                            <div className={cn(
                                                "border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-colors",
                                                isUploading ? "bg-gray-50 dark:bg-gray-700/50" : "hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-cyan-300 dark:hover:border-cyan-400"
                                            )}>
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 size={24} className="text-cyan-400 animate-spin" />
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={20} className="text-gray-400" />
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">Click or drag file to upload</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-center border border-dashed border-gray-200 dark:border-gray-700">
                                            Save task first to add attachments
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        disabled={!title || !project || !dateStr || isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Saving...
                                            </>
                                        ) : (
                                            initialTask ? 'Save Changes' : 'Add Task'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
