import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, NodeToolbar, useReactFlow } from '@xyflow/react';
import { Minus, Plus, Trash2, Square, Circle } from 'lucide-react';

export interface MindMapNodeData extends Record<string, unknown> {
    label: string;
    level: number;
    parentId?: string;
    // Style properties
    color?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: 'sans' | 'serif' | 'mono' | 'cursive';
    shape?: 'rectangle' | 'capsule';
    // Callbacks
    onChange?: (newText: string) => void;
    onStyleChange?: (style: Partial<MindMapNodeData>) => void;
    onAddChild?: () => void;
    onAddSibling?: () => void;
}

const colorOptions = [
    { name: 'White', value: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600' },
    { name: 'Blue', value: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' },
    { name: 'Green', value: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' },
    { name: 'Red', value: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' },
    { name: 'Yellow', value: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' },
    { name: 'Purple', value: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700' },
];

const textColorOptions = [
    { name: 'Default', value: '' },
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#4b5563' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
];

const fontFamilyOptions = [
    { name: 'Sans', value: 'sans', style: 'font-sans' },
    { name: 'Serif', value: 'serif', style: 'font-serif' },
    { name: 'Mono', value: 'mono', style: 'font-mono' },
    { name: 'Cursive', value: 'cursive', style: 'font-cursive' },
];

const MindMapNode: React.FC<NodeProps> = ({ data: rawData, selected, id }) => {
    const data = rawData as MindMapNodeData;
    const { deleteElements } = useReactFlow();
    const [text, setText] = useState(data.label);

    // Style defaults
    const currentColor = data.color || 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    const currentTextColor = data.textColor || '';
    const currentFontSize = data.fontSize || 14;
    const currentFontFamily = data.fontFamily || 'sans';
    const currentShape = data.shape || 'rectangle';

    // Update local state when data changes externally
    React.useEffect(() => {
        setText(data.label);
    }, [data.label]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
        if (data.onChange) {
            data.onChange(e.target.value);
        }
    }, [data]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
        }
    }, []);

    // Style handlers
    const handleColorChange = (color: string) => {
        data.onStyleChange?.({ color });
    };

    const handleTextColorChange = (textColor: string) => {
        data.onStyleChange?.({ textColor });
    };

    const handleFontSizeChange = (delta: number) => {
        const newSize = Math.max(10, Math.min(32, currentFontSize + delta));
        data.onStyleChange?.({ fontSize: newSize });
    };

    const handleFontFamilyChange = (fontFamily: 'sans' | 'serif' | 'mono' | 'cursive') => {
        data.onStyleChange?.({ fontFamily });
    };

    const handleShapeChange = (shape: 'rectangle' | 'capsule') => {
        data.onStyleChange?.({ shape });
    };

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    const fontFamilyClass = fontFamilyOptions.find(f => f.value === currentFontFamily)?.style || 'font-sans';
    const shapeClass = currentShape === 'capsule' ? 'rounded-full px-6' : 'rounded-xl px-4';

    // Default level colors (fallback if no custom color set)
    // But user requested default white. We use currentColor which defaults to white.
    // If we want to keep level colors as an option, we could add them to palette.
    // For now, we respect the user's request: "default is white... overwrite only if changed".
    // But wait, the existing code used level colors.
    // User said: "default is white... overwrite only if changed".
    // So we should prioritize `data.color`. If not set, maybe use level color?
    // Or just default to white as requested.
    // Let's stick to the requested behavior: default white (which is set in currentColor default).

    return (
        <>
            <NodeToolbar isVisible={selected} position={Position.Top}>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex-wrap max-w-[300px]">
                    {/* Shape */}
                    <div className="flex gap-1">
                        <button
                            onClick={() => handleShapeChange('rectangle')}
                            className={`p-1 rounded ${currentShape === 'rectangle' ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            title="Rectangle"
                        >
                            <Square size={16} />
                        </button>
                        <button
                            onClick={() => handleShapeChange('capsule')}
                            className={`p-1 rounded ${currentShape === 'capsule' ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            title="Capsule"
                        >
                            <Circle size={16} />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                    {/* Color Palette */}
                    <div className="flex gap-1">
                        {colorOptions.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => handleColorChange(color.value)}
                                className={`w-5 h-5 rounded border ${color.value.split(' ')[0]} ${currentColor === color.value ? 'ring-2 ring-blue-500' : 'border-gray-300'}`}
                                title={color.name}
                            />
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                    {/* Font Size */}
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleFontSizeChange(-1)} className="p-1 hover:bg-gray-100 rounded"><Minus size={12} /></button>
                        <span className="text-xs w-6 text-center">{currentFontSize}</span>
                        <button onClick={() => handleFontSizeChange(1)} className="p-1 hover:bg-gray-100 rounded"><Plus size={12} /></button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                    {/* Font Family */}
                    <div className="flex gap-1">
                        {fontFamilyOptions.map((font) => (
                            <button
                                key={font.value}
                                onClick={() => handleFontFamilyChange(font.value as any)}
                                className={`px-2 py-1 text-xs rounded ${font.style} ${currentFontFamily === font.value
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                title={font.name}
                            >
                                {font.name.charAt(0)}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                    {/* Text Color */}
                    <div className="flex gap-1">
                        {textColorOptions.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => handleTextColorChange(color.value)}
                                className={`w-4 h-4 rounded-full border border-gray-300 ${currentTextColor === color.value ? 'ring-2 ring-blue-500' : ''}`}
                                style={{ backgroundColor: color.value || '#888' }}
                                title={color.name}
                            />
                        ))}
                    </div>

                    {/* Delete */}
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                    <button onClick={handleDelete} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                </div>
            </NodeToolbar>

            <div
                className={`
                    group relative
                    py-3 border-2 shadow-md transition-all
                    ${currentColor}
                    ${shapeClass}
                    ${selected ? 'ring-4 ring-cyan-400 dark:ring-cyan-500 ring-opacity-50' : ''}
                    min-w-[120px] max-w-[250px]
                `}
            >
                <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
                <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

                <input
                    type="text"
                    value={text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={`nodrag w-full bg-transparent border-none outline-none text-center ${fontFamilyClass}`}
                    style={{
                        fontSize: `${currentFontSize}px`,
                        color: currentTextColor || 'inherit'
                    }}
                    autoFocus
                />

                {/* Add Child Button (Right side) - visible on hover */}
                {data.onAddChild && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            data.onAddChild?.();
                        }}
                        className="nodrag absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                        title="Add child node"
                    >
                        <Plus size={14} />
                    </button>
                )}

                {/* Add Sibling Button (Bottom side) - visible on hover */}
                {data.onAddSibling && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            data.onAddSibling?.();
                        }}
                        className="nodrag absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                        title="Add sibling node"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
        </>
    );
};

export default memo(MindMapNode);
