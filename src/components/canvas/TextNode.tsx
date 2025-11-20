import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

interface TextNodeData {
    text: string;
    onChange: (text: string) => void;
}

const TextNode: React.FC<NodeProps> = ({ data }) => {
    const nodeData = data as unknown as TextNodeData;

    return (
        <div className="px-4 py-3 bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg shadow-lg min-w-[200px] min-h-[120px]">
            <Handle type="target" position={Position.Top} className="w-3 h-3" />
            <textarea
                className="nodrag w-full h-full bg-transparent border-none outline-none resize-none text-gray-900 dark:text-gray-100 text-sm font-handwriting"
                value={nodeData.text}
                onChange={(e) => nodeData.onChange(e.target.value)}
                placeholder="Type your idea..."
                rows={4}
            />
            <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
        </div>
    );
};

export default memo(TextNode);
