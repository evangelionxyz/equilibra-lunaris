import React, { useState } from 'react';
import { X, Send, ExternalLink, Shield, Bell, User } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { updateTelegramChatId } from '../../auth/api';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { user, refreshUser } = useAuth();
    const [chatId, setChatId] = useState(user?.db_user?.telegram_chat_id || '');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!user?.db_user?.id) return;
        setIsSaving(true);
        setMessage(null);
        try {
            await updateTelegramChatId(user.db_user.id, chatId);
            await refreshUser();
            setMessage({ type: 'success', text: 'Settings updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update settings. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-[#0B0E14] border border-[#374151] rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(59,130,246,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-[#374151] flex justify-between items-center bg-gradient-to-r from-[#3B82F6]/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-white text-[18px] font-bold">Account Settings</h2>
                            <p className="text-slate-500 text-[12px]">Manage your profile and notifications</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-[#1F2937] rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* User Info Section */}
                    <section>
                        <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <User size={12} /> Profile Info
                        </h4>
                        <div className="bg-[#151A22] border border-[#374151] rounded-2xl p-4 flex items-center gap-4">
                            <img src={user?.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full border border-[#374151]" />
                            <div className="min-w-0">
                                <h3 className="text-white font-bold truncate">{user?.name || user?.login}</h3>
                                <p className="text-slate-500 text-[12px] truncate">{user?.email || 'No email provided'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Telegram Section */}
                    <section>
                        <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Bell size={12} /> Telegram Notifications
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="text-slate-300 text-[13px] font-medium mb-1.5 block">
                                    Chat ID
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={chatId}
                                        onChange={(e) => setChatId(e.target.value)}
                                        placeholder="Enter your Telegram Chat ID"
                                        className="w-full bg-[#151A22] border border-[#374151] rounded-xl py-3 px-4 text-white text-[14px] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all placeholder:text-slate-600"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#3B82F6] transition-colors">
                                        <Send size={16} />
                                    </div>
                                </div>
                                <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">
                                    Dapatkan Chat ID dengan mengirim pesan <code className="text-[#3B82F6] font-mono">/start</code> ke bot kami.
                                </p>
                            </div>

                            <a
                                href="https://t.me/equilibra_notif_bot"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-[#3B82F6]/5 border border-[#3B82F6]/10 rounded-2xl group hover:bg-[#3B82F6]/10 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white">
                                        <Send size={14} />
                                    </div>
                                    <div>
                                        <span className="text-white text-[13px] font-bold block">Open Telegram Bot</span>
                                        <span className="text-[#3B82F6] text-[11px]">@equilibra_notif_bot</span>
                                    </div>
                                </div>
                                <ExternalLink size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                            </a>
                        </div>
                    </section>

                    {message && (
                        <div className={`p-4 rounded-xl text-[13px] font-medium animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                            }`}>
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#151A22]/50 border-t border-[#374151] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-[14px] font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl bg-[#3B82F6] text-white text-[14px] font-bold hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#3B82F6]/20"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
