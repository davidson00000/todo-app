import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface MindMapNodeData extends Record<string, unknown> {
    label: string;
    level: number;
    parentId?: string;
    onChange?: (newText: string) => void;
}

const MindMapNode: React.FC<NodeProps> = ({ data: rawData, selected }) => {
    const data = rawData as MindMapNodeData;
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.label);

    const handleDoubleClick = useCallback(() => {
        setIsEditing(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsEditing(false);
        if (data.onChange) {
            data.onChange(text);
        }
    }, [text, data]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            setIsEditing(false);
            if (data.onChange) {
                data.onChange(text);
            }
        }
    }, [text, data]);

    // Color based on level
    const getLevelColor = (level: number) => {
        const colors = [
            'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
            'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
            'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
            'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
            'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700',
        ];
        return colors[level % colors.length];
    };

    return (
        <div
            className={`
                px-4 py-3 rounded-2xl border-2 shadow-md transition-all
                ${getLevelColor(data.level)}
                ${selected ? 'ring-4 ring-cyan-400 dark:ring-cyan-500 ring-opacity-50' : ''}
                min-w-[120px] max-w-[200px]
            `}
            onDoubleClick={handleDoubleClick}
        >
            {/* Hidden handles for connections */}
            <Handle type="target" position={Position.Left} className="opacity-0" />
            <Handle type="source" position={Position.Right} className="opacity-0" />

            {isEditing ? (
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm font-medium"
                    autoFocus
                />
            ) : (
                <div className="text-gray-900 dark:text-white text-sm font-medium text-center whitespace-nowrap overflow-hidden text-ellipsis">
                    {data.label || 'New Idea'}
                </div>
            )}
        </div>
    );
};

export default memo(MindMapNode);
