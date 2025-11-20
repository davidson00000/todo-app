import React, { useState } from 'react';
import { X, User, Lock, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    userEmail: string;
    onProfileUpdate: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, userProfile, userEmail, onProfileUpdate }) => {
    const [displayName, setDisplayName] = useState(userProfile?.display_name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !userProfile) return;

        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userProfile.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('task-attachments')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('task-attachments')
                .getPublicUrl(filePath);

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userProfile.id);

            if (updateError) throw updateError;

            onProfileUpdate();
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload avatar. Please try again.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        if (!userProfile) return;

        setIsSaving(true);

        try {
            // Update display name
            if (displayName !== userProfile.display_name) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ display_name: displayName })
                    .eq('id', userProfile.id);

                if (profileError) throw profileError;
            }

            // Update password
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    alert('Passwords do not match!');
                    setIsSaving(false);
                    return;
                }

                if (newPassword.length < 6) {
                    alert('Password must be at least 6 characters!');
                    setIsSaving(false);
                    return;
                }

                const { error: passwordError } = await supabase.auth.updateUser({
                    password: newPassword,
                });

                if (passwordError) throw passwordError;

                alert('Password updated successfully!');
                setNewPassword('');
                setConfirmPassword('');
            }

            onProfileUpdate();
            onClose();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md pointer-events-auto overflow-hidden transition-colors">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h3>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Avatar Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                            {userProfile?.avatar_url ? (
                                                <img src={userProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={40} className="text-gray-500 dark:text-gray-400" />
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={isUploading}
                                            />
                                            <button
                                                disabled={isUploading}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={16} />
                                                        Upload
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={userEmail}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                                    />
                                </div>

                                {/* Display Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        placeholder="Enter your name"
                                    />
                                </div>

                                {/* Password Change */}
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <Lock size={16} />
                                        Change Password
                                    </h4>
                                    <div className="space-y-3">
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            placeholder="New password (min. 6 characters)"
                                        />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
