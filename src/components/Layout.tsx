import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import type { UserProfile } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    userProfile: UserProfile | null;
    userEmail: string;
    onOpenSettings: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, userProfile, userEmail, onOpenSettings }) => {
    const location = useLocation();
    const isCanvas = location.pathname === '/canvas';

    return (
        <div className="h-full w-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
            {!isCanvas && <Header userProfile={userProfile} userEmail={userEmail} onOpenSettings={onOpenSettings} />}
            <main className="flex-1 min-h-0 w-full">
                {children}
            </main>
        </div>
    );
};
