import React, { useState, useEffect } from 'react';
import { Plus, Save, FolderOpen, File, X, Loader2, Trash2 } from 'lucide-react';
import { BackgroundVariant } from '@xyflow/react';
import { supabase } from '../../lib/supabase';
import type { Canvas } from '../../types';

interface CanvasSidebarProps {
    currentCanvasName: string | null;
    onNew: () => void;
    onSave: (name: string) => Promise<void>;
    onLoad: (canvas: Canvas) => void;
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
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 left-16 w-72 bg-white dark:bg-gray-800 shadow-xl z-50 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <h2 className="font-semibold text-gray-900 dark:text-white">Canvas Menu</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* File Management Section */}
                <div className="space-y-4">
                    <button
                        onClick={() => {
                            onNew();
                            onClose();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 bg-cyan-50 dark:bg-blue-900/30 text-cyan-500 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        <Plus size={18} />
                        New Canvas
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current: {currentCanvasName || 'Unsaved'}</h3>
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
                        </div>

                        {showSaveInput && (
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={saveName}
                                    onChange={(e) => setSaveName(e.target.value)}
                                    placeholder="Canvas Name"
                                    className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                                    <button
                                        key={canvas.id}
                                        onClick={() => handleLoad(canvas)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left group"
                                    >
                                        <File size={16} className="text-gray-400 group-hover:text-cyan-400" />
                                        <span className="flex-1 truncate">{canvas.name}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(canvas.updated_at).toLocaleDateString()}
                                        </span>
                                    </button>
                                ))}
                                {canvases.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-4">No saved canvases</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Settings Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Canvas Settings</h3>

                    {/* Background Pattern */}
                    <div className="mb-4">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Background Pattern</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => onVariantChange(BackgroundVariant.Dots)}
                                className={`px-2 py-1.5 text-xs border rounded-md transition-colors ${bgVariant === BackgroundVariant.Dots
                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Dots
                            </button>
                            <button
                                onClick={() => onVariantChange(BackgroundVariant.Lines)}
                                className={`px-2 py-1.5 text-xs border rounded-md transition-colors ${bgVariant === BackgroundVariant.Lines
                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Lines
                            </button>
                            <button
                                onClick={() => onVariantChange(BackgroundVariant.Cross)}
                                className={`px-2 py-1.5 text-xs border rounded-md transition-colors ${bgVariant === BackgroundVariant.Cross
                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
                                <input
                                    type="color"
                                    value={bgColor}
                                    onChange={(e) => onColorChange(e.target.value)}
                                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
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
