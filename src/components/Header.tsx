import React from 'react';
import { Bell, User, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const Header: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">P</span>
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">ProjectDash</h1>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">John Doe</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Product Manager</p>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                        <User size={24} className="text-gray-500 dark:text-gray-400" />
                    </div>
                </div>
            </div>
        </header>
    );
};
