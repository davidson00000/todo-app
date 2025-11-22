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
    const [text, setText] = useState(data.label);

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
        // Prevent global shortcuts (like Backspace deleting the node) from firing while typing
        e.stopPropagation();

        if (e.key === 'Enter') {
            e.preventDefault();
            // Remove focus to finish editing
            (e.target as HTMLInputElement).blur();
        }
    }, []);

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
        >
            {/* Hidden handles for connections */}
            <Handle type="target" position={Position.Left} className="opacity-0" />
            <Handle type="source" position={Position.Right} className="opacity-0" />

            <input
                type="text"
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="nodrag w-full bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm font-medium text-center"
                autoFocus
            />
        </div>
    );
};

export default memo(MindMapNode);
