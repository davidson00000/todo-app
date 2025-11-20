import React from 'react';
import { BackgroundVariant } from '@xyflow/react';
import { Settings, Trash2, Grid, MousePointer2, X } from 'lucide-react';

interface CanvasSettingsProps {
    currentVariant: BackgroundVariant;
    currentColor: string;
    onVariantChange: (variant: BackgroundVariant) => void;
    onColorChange: (color: string) => void;
    onClear: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const CanvasSettings: React.FC<CanvasSettingsProps> = ({
    currentVariant,
    currentColor,
    onVariantChange,
    onColorChange,
    onClear,
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div className="absolute top-16 right-4 w-64 bg-white dark:bg-gray-800 shadow-xl z-50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings size={18} />
                    Canvas Settings
                </h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-4">
                {/* Background Pattern */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Background Pattern
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => onVariantChange(BackgroundVariant.Dots)}
                            className={`p-2 rounded border flex flex-col items-center gap-1 text-xs ${currentVariant === BackgroundVariant.Dots
                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-500'
                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Grid size={16} />
                            Dots
                        </button>
                        <button
                            onClick={() => onVariantChange(BackgroundVariant.Lines)}
                            className={`p-2 rounded border flex flex-col items-center gap-1 text-xs ${currentVariant === BackgroundVariant.Lines
                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-500'
                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Grid size={16} className="rotate-45" />
                            Lines
                        </button>
                        <button
                            onClick={() => onVariantChange(BackgroundVariant.Cross)}
                            className={`p-2 rounded border flex flex-col items-center gap-1 text-xs ${currentVariant === BackgroundVariant.Cross
                                    ? 'bg-cyan-50 border-cyan-400 text-cyan-500'
                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <MousePointer2 size={16} />
                            Cross
                        </button>
                    </div>
                </div>

                {/* Background Color */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Background Color
                    </label>
                    <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => onColorChange(e.target.value)}
                        className="w-full h-8 rounded cursor-pointer"
                    />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to clear the entire canvas? This cannot be undone.')) {
                                onClear();
                            }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                        <Trash2 size={18} />
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CanvasSettings;
