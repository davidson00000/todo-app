import React, { useState, useEffect } from 'react';
import { Plus, Save, FolderOpen, File, Loader2, Trash2, ChevronLeft, Download } from 'lucide-react';
import { BackgroundVariant } from '@xyflow/react';
import { supabase } from '../../lib/supabase';
import type { Canvas } from '../../types';

interface CanvasSidebarProps {
    currentCanvasName: string | null;
    onNew: () => void;
    onSave: (name: string) => Promise<void>;
    onLoad: (canvas: Canvas) => void;
    onDelete: (canvasId: string) => Promise<void>;
    onDownloadPDF: () => Promise<void>;
    isOpen: boolean;
    onClose: () => void;
    bgVariant: BackgroundVariant;
    bgColor: string;
    onVariantChange: (variant: BackgroundVariant) => void;
    onColorChange: (color: string) => void;
    onClear: () => void;
}

const CanvasSidebar: React.FC<CanvasSidebarProps> = ({
    currentCanvasName,
    onNew,
    onSave,
    onLoad,
    onDelete,
    onDownloadPDF,
    isOpen,
    onClose,
    bgVariant,
    bgColor,
    onVariantChange,
    onColorChange,
    onClear,
}) => {
    const [canvases, setCanvases] = useState<Canvas[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCanvases();
        }
    }, [isOpen]);

    const fetchCanvases = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('canvases')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setCanvases(data || []);
        } catch (error) {
            console.error('Error fetching canvases:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!saveName.trim()) return;
        setIsSaving(true);
        try {
            await onSave(saveName);
            setShowSaveInput(false);
            setSaveName('');
            fetchCanvases();
        } catch (error) {
            console.error('Error saving canvas:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoad = (canvas: Canvas) => {
        onLoad(canvas);
        // Don't auto-close on load to keep workflow smooth
    };

    const handleDelete = async (canvasId: string, canvasName: string) => {
        // Stop propagation to prevent loading the canvas
        if (!window.confirm(`Delete "${canvasName}"? This action cannot be undone.`)) {
            return;
        }
        await onDelete(canvasId);
        fetchCanvases(); // Refresh list after deletion
    };

    return (
        <div
            className={`bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col transition-all duration-300 overflow-hidden ${isOpen ? 'w-64' : 'w-0'}`}
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 min-w-64">
                <p className="text-xs text-gray-500 dark:text-slate-500">Canvas Menu</p>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-600 dark:text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Hide sidebar"
                >
                    <ChevronLeft size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 min-w-64">
                {/* File Management Section */}
                <div className="space-y-4">
                    <button
                        onClick={onNew}
                        className="w-full flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus size={16} />
                        New Canvas
                    </button>

                    <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current: {currentCanvasName || 'Unsaved'}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSaveName(currentCanvasName || '');
                                        setShowSaveInput(true);
                                    }}
                                    className="text-cyan-500 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                                >
                                    <Save size={14} />
                                    Save
                                </button>
                                <button
                                    onClick={onDownloadPDF}
                                    className="text-green-500 dark:text-green-400 hover:underline text-sm flex items-center gap-1"
                                    title="Download as PDF"
                                >
                                    <Download size={14} />
                                    PDF
                                </button>
                            </div>
                        </div>

                        {showSaveInput && (
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={saveName}
                                    onChange={(e) => setSaveName(e.target.value)}
                                    placeholder="Canvas Name"
                                    className="flex-1 px-2 py-1 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-2 py-1 bg-cyan-500 text-white rounded text-sm hover:bg-cyan-600 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'OK'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <FolderOpen size={16} />
                            Saved Canvases
                        </h3>

                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 size={24} className="animate-spin text-gray-400" />
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                {canvases.map((canvas) => (
                                    <div
                                        key={canvas.id}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                                    >
                                        <File size={16} className="text-gray-400 group-hover:text-cyan-400 flex-shrink-0" />
                                        <button
                                            onClick={() => handleLoad(canvas)}
                                            className="flex-1 text-left truncate"
                                        >
                                            {canvas.name}
                                        </button>
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                            {new Date(canvas.updated_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(canvas.id, canvas.name);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-all flex-shrink-0"
                                            title="Delete canvas"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {canvases.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-4">No saved canvases</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Settings Section */}
                <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Canvas Settings</h3>

                    {/* Background Pattern */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Background Pattern</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => onVariantChange(BackgroundVariant.Dots)}
                                className={`px-2 py-1.5 text-xs border rounded-md transition-colors ${bgVariant === BackgroundVariant.Dots
                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                Dots
                            </button>
                            <button
                                onClick={() => onVariantChange(BackgroundVariant.Lines)}
                                className={`px-2 py-1.5 text-xs border rounded-md transition-colors ${bgVariant === BackgroundVariant.Lines
                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                Lines
                            </button>
                            <button
                                onClick={() => onVariantChange(BackgroundVariant.Cross)}
                                className={`px-2 py-1.5 text-xs border rounded-md transition-colors ${bgVariant === BackgroundVariant.Cross
                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                Cross
                            </button>
                        </div>
                    </div>

                    {/* Background Color */}
                    <div className="mb-6">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Background Color</label>
                        <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
                                <input
                                    type="color"
                                    value={bgColor}
                                    onChange={(e) => onColorChange(e.target.value)}
                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {bgColor}
                            </span>
                        </div>
                    </div>

                    {/* Clear Canvas */}
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
                                onClear();
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm border border-red-200 dark:border-red-800"
                    >
                        <Trash2 size={16} />
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CanvasSidebar;
