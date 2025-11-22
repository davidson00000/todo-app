import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
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
    type ReactFlowInstance,
    MarkerType,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sun, Moon, ChevronRight, Undo, Redo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MindMapNode, { type MindMapNodeData } from '../components/canvas/MindMapNode';
import CanvasSidebar from '../components/canvas/CanvasSidebar';
import { supabase } from '../lib/supabase';
import { useTheme } from '../components/ThemeProvider';
import type { Canvas } from '../types';
import { getLayoutedElements, buildTreeStructure } from '../lib/dagreLayout';
import { useUndoRedo } from '../hooks/useUndoRedo';

const nodeTypes = {
    mindmap: MindMapNode as any,
};

const STORAGE_KEY = 'ideaMap';
const LAST_OPENED_MAP_ID_KEY = 'lastOpenedMapId';

export const IdeaMap: React.FC = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [_reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [nodeId, setNodeId] = useState(0);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentCanvas, setCurrentCanvas] = useState<Canvas | null>(null);

    // Theme
    const { theme, setTheme } = useTheme();

    // Navigation
    const navigate = useNavigate();

    // Canvas Settings State
    const [bgVariant, setBgVariant] = useState<BackgroundVariant | string>(BackgroundVariant.Lines);
    const [bgColor, setBgColor] = useState('#ffffff');

    // Undo/Redo functionality
    const {
        state: historyState,
        takeSnapshot,
        undo: performUndo,
        redo: performRedo,
        canUndo,
        canRedo,
        reset: resetHistory,
    } = useUndoRedo<{ nodes: Node[]; edges: Edge[] }>({
        nodes: initialNodes,
        edges: initialEdges,
    });

    // Sync history state with React Flow state
    useEffect(() => {
        if (historyState.nodes.length > 0 || historyState.edges.length > 0) {
            setNodes(historyState.nodes);
            setEdges(historyState.edges);
        }
    }, [historyState]);

    // Undo/Redo keyboard shortcuts
    useEffect(() => {
        const handleUndoRedo = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
                event.preventDefault();
                if (event.shiftKey) {
                    performRedo();
                } else {
                    performUndo();
                }
            } else if ((event.metaKey || event.ctrlKey) && event.key === 'y') {
                event.preventDefault();
                performRedo();
            }
        };

        window.addEventListener('keydown', handleUndoRedo);
        return () => window.removeEventListener('keydown', handleUndoRedo);
    }, [performUndo, performRedo]);

    // REMOVED: Auto-layout on edge changes (conflicts with manual layout in addChildNode)
    // The layout is now applied immediately in addChildNode/addSiblingNode
    // useEffect(() => {
    //     if (nodes.length > 0) {
    //         const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges);
    //         setNodes(layoutedNodes.map(node => ({
    //             ...node,
    //             draggable: false,
    //             connectable: false
    //         })));
    //     }
    // }, [edges]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!selectedNode) return;

            // Prevent shortcuts when typing in input
            if ((event.target as HTMLElement).tagName === 'INPUT') return;

            switch (event.key) {
                case 'Tab':
                    event.preventDefault();
                    addChildNode(selectedNode.id);
                    break;
                case 'Enter':
                    event.preventDefault();
                    addSiblingNode(selectedNode.id);
                    break;
                case 'Backspace':
                case 'Delete':
                    event.preventDefault();
                    deleteNode(selectedNode.id);
                    break;
                case 'Escape':
                    setSelectedNode(null);
                    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, nodes, edges]);

    const addChildNode = useCallback((parentId: string) => {
        takeSnapshot({ nodes, edges }); // Snapshot before change

        const newNodeId = `node-${nodeId}`;
        const parentNode = nodes.find((n) => n.id === parentId);
        if (!parentNode) return;

        const parentLevel = (parentNode.data as MindMapNodeData).level || 0;

        const newNode: Node = {
            id: newNodeId,
            type: 'mindmap',
            position: { x: 0, y: 0 },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            draggable: false,
            connectable: false,
            data: {
                label: '', // Start empty for autoFocus
                level: parentLevel + 1,
                parentId: parentId,
                onChange: (newText: string) => {
                    setNodes((nds) =>
                        nds.map((node) =>
                            node.id === newNodeId
                                ? { ...node, data: { ...node.data, label: newText } }
                                : node
                        )
                    );
                },
                onStyleChange: (style: Partial<MindMapNodeData>) => {
                    setNodes((nds) =>
                        nds.map((node) =>
                            node.id === newNodeId
                                ? { ...node, data: { ...node.data, ...style } }
                                : node
                        )
                    );
                },
            },
        };

        const newEdge: Edge = {
            id: `edge-${parentId}-${newNodeId}`,
            source: parentId,
            target: newNodeId,
            type: 'smoothstep',
            markerEnd: {
                type: MarkerType.ArrowClosed,
            },
        };

        // IMPORTANT: Create new arrays for layout calculation
        const updatedNodes = [...nodes, newNode];
        const updatedEdges = [...edges, newEdge];

        // Apply layout immediately with the NEW nodes and edges
        const { nodes: layoutedNodes } = getLayoutedElements(updatedNodes, updatedEdges);

        // Force non-draggable/connectable
        const finalNodes = layoutedNodes.map(node => ({
            ...node,
            draggable: false,
            connectable: false
        }));

        // Update state with layouted nodes and new edges
        setNodes(finalNodes);
        setEdges(updatedEdges);
        setNodeId((id) => id + 1);

        // Auto-select the new node
        setTimeout(() => {
            setSelectedNode(newNode);
            setNodes((nds) =>
                nds.map((n) => ({ ...n, selected: n.id === newNodeId }))
            );
        }, 100);
    }, [nodeId, nodes, edges, setNodes, setEdges, takeSnapshot]);

    const addSiblingNode = useCallback((siblingId: string) => {
        // Find incoming edge to identify parent
        const incomingEdge = edges.find(e => e.target === siblingId);
        const parentId = incomingEdge?.source;

        if (!parentId) {
            // If no parent (Central Idea), behave like adding a child
            addChildNode(siblingId);
        } else {
            // Add as sibling (child of the same parent)
            addChildNode(parentId);
        }
    }, [edges, addChildNode]);

    const deleteNode = useCallback((nodeId: string) => {
        const { childrenMap } = buildTreeStructure(edges);
        const hasChildren = (childrenMap.get(nodeId) || []).length > 0;

        if (hasChildren) {
            const confirmed = window.confirm(
                'This node has children. Delete them too?'
            );
            if (!confirmed) return;

            takeSnapshot({ nodes, edges }); // Snapshot before change

            // Collect all descendants
            const toDelete = new Set([nodeId]);
            const queue = [nodeId];
            while (queue.length > 0) {
                const current = queue.shift()!;
                const children = childrenMap.get(current) || [];
                children.forEach((child) => {
                    toDelete.add(child);
                    queue.push(child);
                });
            }

            setNodes((nds) => nds.filter((n) => !toDelete.has(n.id)));
            setEdges((eds) =>
                eds.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target))
            );
        } else {
            takeSnapshot({ nodes, edges }); // Snapshot before change

            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) =>
                eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
            );
        }

        setSelectedNode(null);
    }, [nodes, edges, setNodes, setEdges, takeSnapshot]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            setSelectedNode(node);
        },
        []
    );

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    // Auto-save to localStorage
    useEffect(() => {
        if (nodes.length > 0 || edges.length > 0) {
            const stateToSave = {
                nodes: nodes.map(({ position, ...node }) => node), // Don't save positions
                edges,
                nextId: nodeId,
                settings: { bgVariant, bgColor },
                canvasInfo: currentCanvas,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        }
    }, [nodes, edges, nodeId, bgVariant, bgColor, currentCanvas]);

    // File Management Functions
    const handleNewCanvas = () => {
        if (window.confirm('Create new mind map? Unsaved changes will be lost.')) {
            // Create initial root node
            const rootNode: Node = {
                id: 'node-0',
                type: 'mindmap',
                position: { x: 250, y: 250 },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                draggable: false,
                connectable: false,
                data: {
                    label: 'Central Idea',
                    level: 0,
                    onChange: (newText: string) => {
                        setNodes((nds) =>
                            nds.map((node) =>
                                node.id === 'node-0'
                                    ? { ...node, data: { ...node.data, label: newText } }
                                    : node
                            )
                        );
                    },
                    onStyleChange: (style: Partial<MindMapNodeData>) => {
                        setNodes((nds) =>
                            nds.map((node) =>
                                node.id === 'node-0'
                                    ? { ...node, data: { ...node.data, ...style } }
                                    : node
                            )
                        );
                    },
                },
            };

            // Reset history with new state
            resetHistory({
                nodes: [rootNode],
                edges: []
            });

            setNodeId(1);
            setCurrentCanvas(null);
            setBgVariant(BackgroundVariant.Lines);
            setBgColor('#ffffff');
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LAST_OPENED_MAP_ID_KEY);
            navigate('/map', { replace: true });
        }
    };

    const handleSaveCanvas = async (name: string) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                alert('Please sign in to save mind maps');
                return;
            }

            const nodesToSave = nodes.map(({ position, data, ...node }) => {
                const { onChange, onStyleChange, ...restData } = data as any;
                return { ...node, data: restData };
            });

            const { data, error } = await supabase
                .from('canvases')
                .upsert({
                    id: currentCanvas?.id,
                    user_id: user.id,
                    name,
                    type: 'mindmap', // Mark as mind map
                    nodes: nodesToSave,
                    edges: edges,
                    background_config: { color: bgColor, variant: bgVariant },
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            setCurrentCanvas(data);
            localStorage.setItem(LAST_OPENED_MAP_ID_KEY, data.id);
            alert('Mind map saved successfully!');
        } catch (error) {
            console.error('Error saving mind map:', error);
            alert('Failed to save mind map');
        }
    };

    const handleLoadCanvas = (canvas: Canvas) => {
        try {
            const loadedNodes = canvas.nodes || [];
            const loadedEdges = canvas.edges || [];
            const nextId = canvas.nextId || 0;
            const settings = canvas.settings;
            const backgroundConfig = (canvas as any).background_config;

            let finalNodes: Node[] = [];

            if (loadedNodes.length > 0) {
                // Restore callbacks and apply layout
                const nodesWithCallbacks = loadedNodes.map((node: any) => ({
                    ...node,
                    position: node.position || { x: 0, y: 0 },
                    data: {
                        ...node.data,
                        onChange: (newText: string) => {
                            setNodes((nds) =>
                                nds.map((n) =>
                                    n.id === node.id
                                        ? { ...n, data: { ...n.data, label: newText } }
                                        : n
                                )
                            );
                        },
                        onStyleChange: (style: Partial<MindMapNodeData>) => {
                            setNodes((nds) =>
                                nds.map((n) =>
                                    n.id === node.id
                                        ? { ...n, data: { ...n.data, ...style } }
                                        : n
                                )
                            );
                        },
                    },
                }));

                const { nodes: layoutedNodes } = getLayoutedElements(
                    nodesWithCallbacks,
                    loadedEdges
                );
                // Force all nodes to be non-draggable and non-connectable
                finalNodes = layoutedNodes.map(node => ({
                    ...node,
                    draggable: false,
                    connectable: false
                }));
            } else {
                finalNodes = [];
            }

            // Reset history with loaded state
            resetHistory({
                nodes: finalNodes,
                edges: loadedEdges || []
            });

            setNodeId(nextId || 0);

            if (backgroundConfig) {
                setBgVariant(backgroundConfig.variant || BackgroundVariant.Lines);
                setBgColor(backgroundConfig.color || '#ffffff');
            } else if (settings) {
                setBgVariant(settings.bgVariant || BackgroundVariant.Lines);
                setBgColor(settings.bgColor || '#ffffff');
            }

            setCurrentCanvas(canvas);
            localStorage.setItem(LAST_OPENED_MAP_ID_KEY, canvas.id);
        } catch (error) {
            console.error('Error loading mind map:', error);
            alert('Failed to load mind map data');
        }
    };

    const handleDeleteCanvas = async (canvasId: string) => {
        if (
            !window.confirm(
                'Are you sure you want to delete this mind map? This action cannot be undone.'
            )
        ) {
            return;
        }

        try {
            const { error } = await supabase
                .from('canvases')
                .delete()
                .eq('id', canvasId);

            if (error) throw error;

            if (currentCanvas?.id === canvasId) {
                handleNewCanvas();
            }

            alert('Mind map deleted successfully!');
        } catch (error) {
            console.error('Error deleting mind map:', error);
            alert('Failed to delete mind map');
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
                : 'mindmap.pdf';
            pdf.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF');
        }
    };

    const handleClearAll = () => {
        handleNewCanvas();
    };

    // Initialize: Load last opened map or create root node
    useEffect(() => {
        const loadLastOpenedMap = async () => {
            const lastMapId = localStorage.getItem(LAST_OPENED_MAP_ID_KEY);
            if (lastMapId) {
                try {
                    const { data, error } = await supabase
                        .from('canvases')
                        .select('*')
                        .eq('id', lastMapId)
                        .single();

                    if (error) throw error;
                    if (data) {
                        handleLoadCanvas(data);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to load last opened map:', error);
                    localStorage.removeItem(LAST_OPENED_MAP_ID_KEY);
                }
            }

            // Fallback: Check local storage for unsaved work
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    if (parsed.nodes && parsed.nodes.length > 0) {
                        // Restore from local state
                        const { nodes: savedNodes, edges: savedEdges, nextId, settings, canvasInfo, background_config } = parsed;

                        // Restore callbacks
                        const nodesWithCallbacks = savedNodes.map((node: any) => ({
                            ...node,
                            position: node.position || { x: 0, y: 0 },
                            data: {
                                ...node.data,
                                onChange: (newText: string) => {
                                    setNodes((nds) =>
                                        nds.map((n) =>
                                            n.id === node.id
                                                ? { ...n, data: { ...n.data, label: newText } }
                                                : n
                                        )
                                    );
                                },
                                onStyleChange: (style: Partial<MindMapNodeData>) => {
                                    setNodes((nds) =>
                                        nds.map((n) =>
                                            n.id === node.id
                                                ? { ...n, data: { ...n.data, ...style } }
                                                : n
                                        )
                                    );
                                },
                            },
                        }));

                        setNodes(nodesWithCallbacks);
                        setEdges(savedEdges || []);
                        setNodeId(nextId || 0);

                        if (background_config) {
                            setBgVariant(background_config.variant || BackgroundVariant.Lines);
                            setBgColor(background_config.color || '#ffffff');
                        } else if (settings) {
                            setBgVariant(settings.bgVariant || BackgroundVariant.Lines);
                            setBgColor(settings.bgColor || '#ffffff');
                        }

                        if (canvasInfo) setCurrentCanvas(canvasInfo);
                        return;
                    }
                } catch (e) {
                    console.error('Failed to restore local state:', e);
                }
            }

            // Initialize with root node if nothing loaded
            if (nodes.length === 0) {
                const rootNode: Node = {
                    id: 'node-0',
                    type: 'mindmap',
                    position: { x: 250, y: 250 },
                    sourcePosition: Position.Right,
                    targetPosition: Position.Left,
                    draggable: false,
                    connectable: false,
                    data: {
                        label: 'Central Idea',
                        level: 0,
                        onChange: (newText: string) => {
                            setNodes((nds) =>
                                nds.map((node) =>
                                    node.id === 'node-0'
                                        ? { ...node, data: { ...node.data, label: newText } }
                                        : node
                                )
                            );
                        },
                    },
                };
                setNodes([rootNode]);
                setNodeId(1);
            }
        };

        loadLastOpenedMap();
    }, []);

    return (
        <div
            className="w-full h-full flex overflow-hidden"
            style={{ backgroundColor: bgColor }}
        >
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
                canvasType="mindmap"
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
                            <ChevronRight
                                size={20}
                                className="text-gray-700 dark:text-gray-200"
                            />
                        </button>
                    )}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? (
                            <Sun size={20} className="text-yellow-500" />
                        ) : (
                            <Moon size={20} className="text-gray-700" />
                        )}
                    </button>

                    <button
                        onClick={performUndo}
                        disabled={!canUndo}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Undo (Cmd+Z)"
                    >
                        <Undo size={20} className="text-gray-700 dark:text-gray-200" />
                    </button>

                    <button
                        onClick={performRedo}
                        disabled={!canRedo}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Redo (Cmd+Shift+Z)"
                    >
                        <Redo size={20} className="text-gray-700 dark:text-gray-200" />
                    </button>
                </div>

                {/* Instructions */}
                <div className="absolute top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Keyboard Shortcuts
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                        <div>
                            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                Tab
                            </kbd>{' '}
                            Add child
                        </div>
                        <div>
                            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                Enter
                            </kbd>{' '}
                            Add sibling
                        </div>
                        <div>
                            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                Backspace
                            </kbd>{' '}
                            Delete
                        </div>
                    </div>
                </div>

                <div ref={reactFlowWrapper} className="w-full h-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        onInit={setReactFlowInstance}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-transparent"
                    >
                        {bgVariant !== 'none' && (
                            <Background variant={bgVariant as BackgroundVariant} />
                        )}
                        <Controls />
                        <MiniMap />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
};
