import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    type Connection,
    type Node,
    type Edge,
    type NodeTypes,
    type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sun, Moon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import StickyNode from '../components/canvas/StickyNode';
import ImageNode from '../components/canvas/ImageNode';
import CanvasSidebar from '../components/canvas/CanvasSidebar';
import { supabase } from '../lib/supabase';
import { useTheme } from '../components/ThemeProvider';
import type { Canvas } from '../types';

const nodeTypes: NodeTypes = {
    sticky: StickyNode,
    image: ImageNode,
};

const STORAGE_KEY = 'ideaCanvas';

export const IdeaCanvas: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [nodeId, setNodeId] = useState(0);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentCanvas, setCurrentCanvas] = useState<Canvas | null>(null);

    // Theme
    const { theme, setTheme } = useTheme();

    // Navigation
    const navigate = useNavigate();

    // Canvas Settings State
    const [bgVariant, setBgVariant] = useState<BackgroundVariant | string>(BackgroundVariant.Dots);
    const [bgColor, setBgColor] = useState('#f9fafb'); // Default gray-50

    // Helper to restore callbacks
    const restoreNodeCallbacks = useCallback((nodesToRestore: Node[]) => {
        return nodesToRestore.map((node) => {
            if (node.type === 'sticky') {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onChange: (newText: string) => {
                            setNodes((nds) =>
                                nds.map((n) =>
                                    n.id === node.id
                                        ? { ...n, data: { ...n.data, text: newText } }
                                        : n
                                )
                            );
                        },
                        onStyleChange: (style: any) => {
                            setNodes((nds) =>
                                nds.map((n) =>
                                    n.id === node.id
                                        ? { ...n, data: { ...n.data, ...style } }
                                        : n
                                )
                            );
                        },
                    },
                };
            } else if (node.type === 'image') {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        onImageChange: (newUrl: string) => {
                            setNodes((nds) =>
                                nds.map((n) =>
                                    n.id === node.id
                                        ? { ...n, data: { ...n.data, url: newUrl } }
                                        : n
                                )
                            );
                        },
                    },
                };
            }
            return node;
        });
    }, [setNodes]);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCanvas = localStorage.getItem(STORAGE_KEY);
        if (savedCanvas) {
            try {
                const parsed = JSON.parse(savedCanvas);
                const { nodes: savedNodes, edges: savedEdges, nextId, settings, canvasInfo } = parsed;

                if (savedNodes && Array.isArray(savedNodes)) {
                    setNodes(restoreNodeCallbacks(savedNodes));
                }
                if (savedEdges && Array.isArray(savedEdges)) {
                    setEdges(savedEdges);
                }
                setNodeId(nextId || 0);

                if (settings) {
                    setBgVariant(settings.bgVariant || BackgroundVariant.Dots);
                    setBgColor(settings.bgColor || '#f9fafb');
                }

                if (canvasInfo) {
                    setCurrentCanvas(canvasInfo);
                }
            } catch (error) {
                console.error('Failed to load canvas from localStorage:', error);
                // Fallback: Clear everything if corrupted
                setNodes([]);
                setEdges([]);
                setNodeId(0);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, [restoreNodeCallbacks]);

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (nodes.length > 0 || edges.length > 0) {
            const nodesToSave = nodes.map(({ data, ...node }) => {
                if (node.type === 'sticky') {
                    const { onChange, onStyleChange, ...restData } = data as any;
                    return { ...node, data: restData };
                } else if (node.type === 'image') {
                    const { onImageChange, ...restData } = data as any;
                    return { ...node, data: restData };
                }
                return { ...node, data };
            });

            const stateToSave = {
                nodes: nodesToSave,
                edges,
                nextId: nodeId,
                settings: { bgVariant, bgColor },
                canvasInfo: currentCanvas
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        }
    }, [nodes, edges, nodeId, bgVariant, bgColor, currentCanvas]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onPaneClick = useCallback(
        (event: React.MouseEvent) => {
            if (event.detail !== 2) return;
            if (!reactFlowInstance) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const currentNodeId = nodeId;
            const newNodeIdStr = `node-${currentNodeId}`;

            const newNode: Node = {
                id: newNodeIdStr,
                type: 'sticky',
                position,
                data: {
                    text: '',
                    color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
                    fontSize: 16,
                    fontFamily: 'cursive',
                    isTransparent: false,
                    onChange: (newText: string) => {
                        setNodes((nds) =>
                            nds.map((node) =>
                                node.id === newNodeIdStr
                                    ? { ...node, data: { ...node.data, text: newText } }
                                    : node
                            )
                        );
                    },
                    onStyleChange: (style: any) => {
                        setNodes((nds) =>
                            nds.map((node) =>
                                node.id === newNodeIdStr
                                    ? { ...node, data: { ...node.data, ...style } }
                                    : node
                            )
                        );
                    },
                },
            };

            setNodes((nds) => [...nds, newNode]);
            setNodeId((id) => id + 1);
        },
        [reactFlowInstance, nodeId, setNodes]
    );

    const onDrop = useCallback(
        async (event: React.DragEvent) => {
            event.preventDefault();
            if (!reactFlowInstance) return;

            const files = Array.from(event.dataTransfer.files);
            const imageFiles = files.filter((file) => file.type.startsWith('image/'));

            if (imageFiles.length === 0) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            for (const file of imageFiles) {
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `canvas/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('task-attachments')
                        .upload(filePath, file, { upsert: true });

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('task-attachments')
                        .getPublicUrl(filePath);

                    const currentNodeId = nodeId;
                    const newNodeIdStr = `node-${currentNodeId}`;

                    const newNode: Node = {
                        id: newNodeIdStr,
                        type: 'image',
                        position: { x: position.x, y: position.y + (currentNodeId - nodeId) * 20 },
                        data: {
                            url: publicUrl,
                            alt: file.name,
                            onImageChange: (newUrl: string) => {
                                setNodes((nds) =>
                                    nds.map((node) =>
                                        node.id === newNodeIdStr
                                            ? { ...node, data: { ...node.data, url: newUrl } }
                                            : node
                                    )
                                );
                            },
                        },
                        style: { width: 200, height: 200 },
                    };

                    setNodes((nds) => [...nds, newNode]);
                    setNodeId((id) => id + 1);
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert(`Failed to upload ${file.name}. Please try again.`);
                }
            }
        },
        [reactFlowInstance, nodeId, setNodes]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }, []);

    // File Management Functions
    const handleNewCanvas = () => {
        if (window.confirm('Create new canvas? Unsaved changes will be lost.')) {
            // Clear canvas state
            setNodes([]);
            setEdges([]);
            setNodeId(0);
            setCurrentCanvas(null);

            // Reset canvas settings to defaults
            setBgVariant(BackgroundVariant.Dots);
            setBgColor('#f9fafb');

            // Clear local storage
            localStorage.removeItem(STORAGE_KEY);

            // Clear URL parameters (navigate to clean /canvas route)
            navigate('/canvas', { replace: true });
        }
    };

    const handleSaveCanvas = async (name: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please sign in to save canvases');
                return;
            }

            const nodesToSave = nodes.map(({ data, ...node }) => {
                if (node.type === 'sticky') {
                    const { onChange, onStyleChange, ...restData } = data as any;
                    return { ...node, data: restData };
                } else if (node.type === 'image') {
                    const { onImageChange, ...restData } = data as any;
                    return { ...node, data: restData };
                }
                return { ...node, data };
            });



            const { data, error } = await supabase
                .from('canvases')
                .upsert({
                    id: currentCanvas?.id, // If exists, update
                    user_id: user.id,
                    name,
                    nodes: nodesToSave,
                    edges: edges,
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            setCurrentCanvas(data);
            alert('Canvas saved successfully!');
        } catch (error) {
            console.error('Error saving canvas:', error);
            alert('Failed to save canvas');
        }
    };

    const handleLoadCanvas = (canvas: Canvas) => {
        try {
            // Support both old 'data' structure and new 'nodes/edges' columns
            const loadedNodes = canvas.nodes || canvas.data?.nodes || [];
            const loadedEdges = canvas.edges || canvas.data?.edges || [];
            const nextId = canvas.nextId || canvas.data?.nextId || 0;
            const settings = canvas.settings || canvas.data?.settings;

            if (loadedNodes) {
                setNodes(restoreNodeCallbacks(loadedNodes));
            } else {
                setNodes([]);
            }

            setEdges(loadedEdges || []);
            setNodeId(nextId || 0);

            if (settings) {
                setBgVariant(settings.bgVariant || BackgroundVariant.Dots);
                setBgColor(settings.bgColor || '#f9fafb');
            }

            setCurrentCanvas(canvas);
        } catch (error) {
            console.error('Error loading canvas:', error);
            alert('Failed to load canvas data');
        }
    };

    const handleClearAll = () => {
        setNodes([]);
        setEdges([]);
        setNodeId(0);
    };

    const handleDeleteCanvas = async (canvasId: string) => {
        if (!window.confirm('Are you sure you want to delete this canvas? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('canvases')
                .delete()
                .eq('id', canvasId);

            if (error) throw error;

            // If the deleted canvas is the current one, clear the canvas
            if (currentCanvas?.id === canvasId) {
                setNodes([]);
                setEdges([]);
                setNodeId(0);
                setCurrentCanvas(null);
                setBgVariant(BackgroundVariant.Dots);
                setBgColor('#f9fafb');
                localStorage.removeItem(STORAGE_KEY);
            }

            alert('Canvas deleted successfully!');
        } catch (error) {
            console.error('Error deleting canvas:', error);
            alert('Failed to delete canvas');
        }
    };

    const handleDownloadPDF = async () => {
        if (!reactFlowWrapper.current) return;

        try {
            const viewport = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement;
            if (!viewport) {
                alert('Canvas viewport not found');
                return;
            }

            // Generate image from the viewport
            const dataUrl = await toPng(viewport, {
                backgroundColor: bgColor,
                quality: 1,
                pixelRatio: 2, // Higher resolution
            });

            // Create PDF
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [viewport.offsetWidth, viewport.offsetHeight],
            });

            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                pdf.addImage(
                    dataUrl,
                    'PNG',
                    0,
                    0,
                    viewport.offsetWidth,
                    viewport.offsetHeight
                );

                const fileName = currentCanvas?.name
                    ? `${currentCanvas.name}.pdf`
                    : 'canvas.pdf';
                pdf.save(fileName);
            };
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF');
        }
    };

    return (
        <div className="w-full h-full flex overflow-hidden" style={{ backgroundColor: bgColor }}>
            <CanvasSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentCanvasName={currentCanvas?.name || null}
                onNew={handleNewCanvas}
                onSave={handleSaveCanvas}
                onLoad={handleLoadCanvas}
                onDelete={handleDeleteCanvas}
                onDownloadPDF={handleDownloadPDF}
                bgVariant={bgVariant}
                bgColor={bgColor}
                onVariantChange={setBgVariant}
                onColorChange={setBgColor}
                onClear={handleClearAll}
                canvasType="canvas"
            />

            <div className="flex-1 h-full relative overflow-hidden">
                {/* Header / Toolbar */}
                <div className="absolute top-4 left-4 z-50 flex gap-2">
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            title="Show Menu"
                        >
                            <ChevronRight size={20} className="text-gray-700 dark:text-gray-200" />
                        </button>
                    )}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={20} className="text-gray-700 dark:text-gray-200" /> : <Moon size={20} className="text-gray-700 dark:text-gray-200" />}
                    </button>
                    <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center">
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                            {currentCanvas ? currentCanvas.name : 'Untitled Canvas'}
                        </span>
                    </div>
                </div>

                <div className="h-full w-full" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onPaneClick={onPaneClick}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        deleteKeyCode={['Backspace', 'Delete']}
                        fitView
                        minZoom={0.1}
                        maxZoom={4}
                    >
                        <Controls />
                        <MiniMap />
                        {bgVariant !== 'none' && (
                            <Background variant={bgVariant as BackgroundVariant} gap={16} size={1} />
                        )}
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
};
