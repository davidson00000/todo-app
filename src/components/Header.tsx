import React from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { UserMenu } from './UserMenu';
import type { UserProfile } from '../types';

interface HeaderProps {
    userProfile: UserProfile | null;
    userEmail: string;
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userProfile, userEmail, onOpenSettings }) => {
    const { theme, setTheme } = useTheme();

    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-2">
                {/* Branding moved to Sidebar */}
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
                <UserMenu
                    userProfile={userProfile}
                    userEmail={userEmail}
                    onOpenSettings={onOpenSettings}
                />
            </div>
        </header>
    );
};
