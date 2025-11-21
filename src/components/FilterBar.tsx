import React, { useState } from 'react';
import { Search, X, ChevronDown, Filter as FilterIcon } from 'lucide-react';
import type { Project } from '../types';
import type { DueDateFilter, PriorityFilter, StatusFilter } from '../lib/filterUtils';

interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedProject: string;
    onProjectChange: (project: string) => void;
    selectedDueDate: DueDateFilter;
    onDueDateChange: (filter: DueDateFilter) => void;
    selectedPriority: PriorityFilter;
    onPriorityChange: (filter: PriorityFilter) => void;
    selectedStatus: StatusFilter;
    onStatusChange: (filter: StatusFilter) => void;
    onClearFilters: () => void;
    projects: Project[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
    searchQuery,
    onSearchChange,
    selectedProject,
    onProjectChange,
    selectedDueDate,
    onDueDateChange,
    selectedPriority,
    onPriorityChange,
    selectedStatus,
    onStatusChange,
    onClearFilters,
    projects,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasActiveFilters =
        searchQuery ||
        selectedProject !== 'all' ||
        selectedDueDate !== 'all' ||
        selectedPriority !== 'all' ||
        selectedStatus !== 'all';

    const filterCount = [
        searchQuery ? 1 : 0,
        selectedProject !== 'all' ? 1 : 0,
        selectedDueDate !== 'all' ? 1 : 0,
        selectedPriority !== 'all' ? 1 : 0,
        selectedStatus !== 'all' ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Compact Bar - Always Visible */}
            <div className="p-3">
                <div className="flex gap-2">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="タスクを検索..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent"
                        />
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${hasActiveFilters
                                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        <FilterIcon className="w-4 h-4" />
                        <span>フィルター</span>
                        {filterCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {filterCount}
                            </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Clear Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Filters - Slide Down */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Project Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                プロジェクト
                            </label>
                            <select
                                value={selectedProject}
                                onChange={(e) => onProjectChange(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent"
                            >
                                <option value="all">すべて</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.name}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Due Date Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                期限
                            </label>
                            <select
                                value={selectedDueDate}
                                onChange={(e) => onDueDateChange(e.target.value as DueDateFilter)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent"
                            >
                                <option value="all">すべて</option>
                                <option value="overdue">期限切れ</option>
                                <option value="today">今日</option>
                                <option value="this-week">今週</option>
                                <option value="this-month">今月</option>
                                <option value="no-date">期限なし</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                優先度
                            </label>
                            <select
                                value={selectedPriority}
                                onChange={(e) => onPriorityChange(e.target.value as PriorityFilter)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent"
                            >
                                <option value="all">すべて</option>
                                <option value="high">高</option>
                                <option value="medium">中</option>
                                <option value="low">低</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                ステータス
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent"
                            >
                                <option value="all">すべて</option>
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active filters indicator (only when collapsed) */}
            {hasActiveFilters && !isExpanded && (
                <div className="px-3 pb-3 flex flex-wrap gap-2">
                    {searchQuery && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">
                            検索: {searchQuery}
                        </span>
                    )}
                    {selectedProject !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">
                            {selectedProject}
                        </span>
                    )}
                    {selectedDueDate !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">
                            {getDueDateLabel(selectedDueDate)}
                        </span>
                    )}
                    {selectedPriority !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">
                            優先度: {getPriorityLabel(selectedPriority)}
                        </span>
                    )}
                    {selectedStatus !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">
                            {getStatusLabel(selectedStatus)}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

function getDueDateLabel(filter: DueDateFilter): string {
    const labels: Record<DueDateFilter, string> = {
        'all': 'すべて',
        'overdue': '期限切れ',
        'today': '今日',
        'this-week': '今週',
        'this-month': '今月',
        'no-date': '期限なし',
    };
    return labels[filter];
}

function getPriorityLabel(filter: PriorityFilter): string {
    const labels: Record<PriorityFilter, string> = {
        'all': 'すべて',
        'high': '高',
        'medium': '中',
        'low': '低',
    };
    return labels[filter];
}

function getStatusLabel(filter: StatusFilter): string {
    const labels: Record<StatusFilter, string> = {
        'all': 'すべて',
        'todo': 'To Do',
        'in-progress': 'In Progress',
        'done': 'Done',
    };
    return labels[filter];
}
