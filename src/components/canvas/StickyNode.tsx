import React, { memo } from 'react';
import { Handle, Position, NodeToolbar, NodeResizer, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Type, StickyNote, Minus, Plus, Trash2 } from 'lucide-react';

interface StickyNodeData {
    text: string;
    color?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: 'sans' | 'serif' | 'mono' | 'cursive';
    isTransparent?: boolean;
    onChange: (text: string) => void;
    onStyleChange?: (style: Partial<StickyNodeData>) => void;
}

const colorOptions = [
    { name: 'Yellow', value: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' },
    { name: 'Blue', value: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' },
    { name: 'Green', value: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' },
    { name: 'Red', value: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' },
    { name: 'White', value: 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600' },
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

const StickyNode: React.FC<NodeProps> = ({ data, selected, id }) => {
    const nodeData = data as unknown as StickyNodeData;
    const { deleteElements } = useReactFlow();

    const currentColor = nodeData.color || colorOptions[0].value;
    const currentTextColor = nodeData.textColor || '';
    const currentFontSize = nodeData.fontSize || 16;
    const currentFontFamily = nodeData.fontFamily || 'cursive';
    const isTransparent = nodeData.isTransparent || false;

    const handleColorChange = (color: string) => {
        nodeData.onStyleChange?.({ color });
    };

    const handleTextColorChange = (textColor: string) => {
        nodeData.onStyleChange?.({ textColor });
    };

    const handleFontSizeChange = (delta: number) => {
        const newSize = Math.max(10, Math.min(72, currentFontSize + delta));
        nodeData.onStyleChange?.({ fontSize: newSize });
    };

    const handleFontFamilyChange = (fontFamily: 'sans' | 'serif' | 'mono' | 'cursive') => {
        nodeData.onStyleChange?.({ fontFamily });
    };

    const handleModeToggle = () => {
        nodeData.onStyleChange?.({ isTransparent: !isTransparent });
    };

    const handleDelete = () => {
        deleteElements({ nodes: [{ id }] });
    };

    const extractLinks = (text: string): string[] => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    };

    const links = extractLinks(nodeData.text);

    const fontFamilyClass = fontFamilyOptions.find(f => f.value === currentFontFamily)?.style || 'font-cursive';

    return (
        <>
            <NodeToolbar isVisible={selected} position={Position.Top}>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    {/* Mode Toggle */}
                    <div className="flex gap-1">
                        <button
                            onClick={handleModeToggle}
                            className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${!isTransparent
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            title="Sticky mode"
                        >
                            <StickyNote size={14} />
                            Sticky
                        </button>
                        <button
                            onClick={handleModeToggle}
                            className={`px-3 py-1 text-xs rounded flex items-center gap-1 ${isTransparent
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            title="Text-only mode"
                        >
                            <Type size={14} />
                            Text
                        </button>
                    </div>

                    {/* Color Palette - only show in sticky mode */}
                    {!isTransparent && (
                        <>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                            <div className="flex gap-1">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color.name}
                                        onClick={() => handleColorChange(color.value)}
                                        className={`w-6 h-6 rounded border-2 ${color.value} ${currentColor === color.value ? 'ring-2 ring-blue-500' : ''
                                            }`}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                    {/* Font Size */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleFontSizeChange(-2)}
                            className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="Decrease font size"
                        >
                            <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[40px] text-center">
                            {currentFontSize}px
                        </span>
                        <button
                            onClick={() => handleFontSizeChange(2)}
                            className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="Increase font size"
                        >
                            <Plus size={12} />
                        </button>
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
                                {font.name}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                    {/* Text Color */}
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 font-medium mr-1">A</span>
                        {textColorOptions.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => handleTextColorChange(color.value)}
                                className={`w-4 h-4 rounded-full border border-gray-300 ${currentTextColor === color.value ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                style={{ backgroundColor: color.value || '#888' }}
                                title={color.name}
                            />
                        ))}
                    </div>

                    {/* Links */}
                    {links.length > 0 && (
                        <>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                            {links.slice(0, 2).map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                                >
                                    🔗 Link
                                </a>
                            ))}
                        </>
                    )}

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                    {/* Delete Button */}
                    <button
                        onClick={handleDelete}
                        className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center gap-1"
                        title="Delete node"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </NodeToolbar>

            <NodeResizer
                color="#3b82f6"
                isVisible={selected}
                minWidth={100}
                minHeight={80}
            />

            <div
                className={`rounded-lg min-w-[100px] min-h-[80px] w-full h-full transition-all overflow-hidden ${isTransparent
                    ? `bg-transparent ${selected ? 'ring-2 ring-blue-500 ring-inset' : ''}`
                    : `${currentColor} ${selected ? '' : 'border-2'} shadow-lg`
                    }`}
            >
                <Handle type="target" position={Position.Top} className="w-3 h-3" />
                <textarea
                    className={`nodrag w-full h-full bg-transparent border-none outline-none resize-none p-4 ${isTransparent
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-900 dark:text-gray-100'
                        } ${fontFamilyClass}`}
                    value={nodeData.text}
                    onChange={(e) => nodeData.onChange(e.target.value)}
                    placeholder="Type your idea..."
                    style={{
                        fontSize: `${currentFontSize}px`,
                        lineHeight: '1.5',
                        boxShadow: 'none',
                        boxSizing: 'border-box',
                        minWidth: '100px',
                        minHeight: '80px',
                        color: currentTextColor || undefined,
                    }}
                />
                <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
            </div>
        </>
    );
};

export default memo(StickyNode);
