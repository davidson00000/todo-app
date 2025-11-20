import React, { memo, useState, useRef } from 'react';
import { Handle, Position, NodeToolbar, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageNodeData {
    url: string;
    alt?: string;
    onImageChange?: (url: string) => void;
}

const ImageNode: React.FC<NodeProps> = ({ data, selected }) => {
    const nodeData = data as unknown as ImageNodeData;
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `canvas/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(filePath);

            nodeData.onImageChange?.(publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <NodeToolbar isVisible={selected} position={Position.Top}>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1 text-xs rounded bg-cyan-500 text-white hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-1"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload size={14} />
                                Change Image
                            </>
                        )}
                    </button>
                </div>
            </NodeToolbar>

            <NodeResizer
                color="#3b82f6"
                isVisible={selected}
                minWidth={100}
                minHeight={100}
                keepAspectRatio
            />

            <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
                <Handle type="target" position={Position.Top} className="w-3 h-3" />
                <img
                    src={nodeData.url}
                    alt={nodeData.alt || 'Canvas image'}
                    className="w-full h-full object-contain"
                    draggable={false}
                />
                <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
            </div>
        </>
    );
};

export default memo(ImageNode);
