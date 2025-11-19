import React from 'react';
import { Header } from './Header';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
            <Header />
            <main className="flex-1 px-4 md:px-6 py-6 max-w-7xl mx-auto w-full overflow-x-hidden">
                {children}
            </main>
        </div>
    );
};
