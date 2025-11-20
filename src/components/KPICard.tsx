import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: LucideIcon;
    className?: string;
    onIconClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, change, trend, icon: Icon, className, onIconClick }) => {
    return (
        <div className={clsx("bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full transition-colors", className)}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
                </div>
                <div
                    onClick={onIconClick}
                    className={clsx(
                        "p-2 bg-cyan-50 dark:bg-blue-900/20 rounded-lg text-cyan-500 dark:text-blue-400",
                        onIconClick && "cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    )}
                >
                    <Icon size={20} />
                </div>
            </div>
            {change && (
                <div className="flex items-center text-sm">
                    <span className={clsx(
                        "font-medium px-2 py-0.5 rounded-full text-xs",
                        trend === 'up' ? "text-green-700 bg-green-50" :
                            trend === 'down' ? "text-red-700 bg-red-50" : "text-gray-600 bg-gray-100"
                    )}>
                        {change}
                    </span>
                    <span className="text-gray-400 ml-2">vs last month</span>
                </div>
            )}
        </div>
    );
};
