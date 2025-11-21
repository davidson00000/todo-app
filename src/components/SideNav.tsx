import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FolderKanban, Lightbulb, Settings, ChevronLeft, ChevronRight, Map, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

interface SideNavProps {
    onOpenSettings: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({ onOpenSettings }) => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems = [
        { icon: Lightbulb, label: 'Idea Canvas', path: '/canvas' },
        { icon: Brain, label: 'Idea Map', path: '/map' },
        { icon: Map, label: 'Roadmap', path: '/roadmap' },
        { icon: FolderKanban, label: 'Projects', path: '/' },
    ];

    return (
        <div
            className={cn(
                "flex-none h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col py-6 transition-all duration-300 ease-in-out z-50 hidden md:flex relative",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-7 -right-3 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center shadow-sm text-gray-500 dark:text-slate-400 hover:text-cyan-400 transition-colors z-50"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Logo Area */}
            <div className={cn("px-6 mb-8 transition-all duration-300", isCollapsed && "px-0 flex justify-center mb-4")}>
                {isCollapsed ? (
                    <h1 className="text-2xl font-bold text-cyan-500 tracking-wide font-sans">E</h1>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-cyan-500 tracking-wide font-sans whitespace-nowrap overflow-hidden">EXITON</h1>
                        <p className="text-xs text-gray-500 dark:text-slate-500 font-mono mt-1 whitespace-nowrap overflow-hidden">$ make human.protocols</p>
                    </>
                )}
            </div>

            <div className="flex flex-col gap-2 px-3">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                                isActive
                                    ? "bg-cyan-500/10 text-cyan-400"
                                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-cyan-400",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon size={20} className="flex-shrink-0" />
                            {!isCollapsed && (
                                <span className="font-medium text-sm whitespace-nowrap overflow-hidden transition-opacity duration-200">
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto px-3 flex flex-col gap-2">
                <button
                    onClick={onOpenSettings}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-cyan-400 transition-all group",
                        isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? "Settings" : undefined}
                >
                    <Settings size={20} className="flex-shrink-0" />
                    {!isCollapsed && (
                        <span className="font-medium text-sm whitespace-nowrap overflow-hidden">Settings</span>
                    )}
                </button>
            </div>
        </div>
    );
};
