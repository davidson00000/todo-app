import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Settings, LogOut, User } from 'lucide-react';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface UserMenuProps {
    userProfile: UserProfile | null;
    userEmail: string;
    onOpenSettings: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ userProfile, userEmail, onOpenSettings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const displayName = userProfile?.display_name || userEmail.split('@')[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors p-2"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                </div>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                    {userProfile?.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={24} className="text-gray-500 dark:text-gray-400" />
                    )}
                </div>
                <ChevronDown size={16} className={`text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button
                        onClick={() => {
                            onOpenSettings();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Settings size={16} />
                        Settings
                    </button>
                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};
