import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Download, X, ChevronLeft, Loader2 } from 'lucide-react';
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
    canvasType?: 'canvas' | 'mindmap'; // Filter by canvas type
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
    canvasType = 'canvas', // Default to 'canvas' type
}) => {
    const [canvases, setCanvases] = useState<Canvas[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    const label = canvasType === 'mindmap' ? 'Map' : 'Canvas';

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

            let query = supabase
                .from('canvases')
                .select('*')
                .eq('user_id', user.id);

            // Filter by canvas type
            if (canvasType) {
                query = query.eq('type', canvasType);
            }

            const { data, error } = await query.order('updated_at', { ascending: false });

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
            className={`
                h-full bg-white dark:bg-slate-900 shadow-xl z-40 transition-all duration-300 ease-in-out flex flex-col
                ${isOpen ? 'w-64 border-r border-gray-200 dark:border-slate-800' : 'w-0 overflow-hidden'}
            `}
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
                <p className="text-xs text-gray-500 dark:text-slate-500">{label} Menu</p>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md text-gray-500 dark:text-gray-400 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Menu Section */}
                <div className="mb-8">
                    <div className="mt-2 space-y-2">
                        <button
                            onClick={onNew}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                            <Plus size={16} />
                            New {label}
                        </button>

                        <div className="pt-2 pb-2">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current: {currentCanvasName || 'Unsaved'}</h3>
                            <div className="flex gap-2 mt-2">
                                {showSaveInput ? (
                                    <div className="flex gap-2 w-full">
                                        <input
                                            type="text"
                                            value={saveName}
                                            onChange={(e) => setSaveName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSave();
                                                if (e.key === 'Escape') setShowSaveInput(false);
                                            }}
                                            className="flex-1 px-2 py-1 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            placeholder={`${label} Name`}
                                            autoFocus
                                        />
                                        <button onClick={handleSave} disabled={isSaving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        </button>
                                        <button onClick={() => setShowSaveInput(false)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                setSaveName(currentCanvasName || '');
                                                setShowSaveInput(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-md transition-colors"
                                        >
                                            <Save size={16} />
                                            Save
                                        </button>
                                        <button
                                            onClick={onDownloadPDF}
                                            className="flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm rounded-md transition-colors"
                                            title="Download PDF"
                                        >
                                            <Download size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saved Canvases List */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                            Saved {label}s
                        </h3>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 size={24} className="animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                            {canvases.map((canvas) => (
                                <div
                                    key={canvas.id}
                                    className="group flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
                                    onClick={() => handleLoad(canvas)}
                                >
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-medium truncate">{canvas.name}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(canvas.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(canvas.id, canvas.name);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                        title={`Delete ${label.toLowerCase()}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {canvases.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">No saved {label.toLowerCase()}s</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Settings Section */}
                <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{label} Settings</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Background Style</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => onVariantChange(BackgroundVariant.Dots)}
                                    className={`px-3 py-2 text-xs rounded border ${bgVariant === BackgroundVariant.Dots
                                        ? 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-400'
                                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    Dots
                                </button>
                                <button
                                    onClick={() => onVariantChange(BackgroundVariant.Lines)}
                                    className={`px-3 py-2 text-xs rounded border ${bgVariant === BackgroundVariant.Lines
                                        ? 'bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-400'
                                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    Lines
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Background Color</label>
                            <div className="flex gap-2">
                                {['#ffffff', '#f8fafc', '#f0f9ff', '#f0fdf4', '#fff1f2'].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => onColorChange(color)}
                                        className={`w-6 h-6 rounded-full border ${bgColor === color ? 'ring-2 ring-cyan-500 ring-offset-2' : 'border-gray-200'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-200 dark:border-slate-800">
                    {/* Clear Canvas */}
                    <button
                        onClick={() => {
                            if (window.confirm(`Are you sure you want to clear the entire ${label.toLowerCase()}? This cannot be undone.`)) {
                                onClear();
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        <Trash2 size={16} />
                        Clear {label}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CanvasSidebar;
