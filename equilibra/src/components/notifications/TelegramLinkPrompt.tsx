import React from 'react';
import { Send, ArrowRight, BellRing } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

interface TelegramLinkPromptProps {
    onOpenSettings: () => void;
}

export const TelegramLinkPrompt: React.FC<TelegramLinkPromptProps> = ({ onOpenSettings }) => {
    const { user } = useAuth();

    // Only show if user is logged in but has no telegram_chat_id
    if (!user || user.db_user?.telegram_chat_id) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[90] animate-in slide-in-from-right-10 fade-in duration-500 max-w-sm w-full">
            <div className="bg-[#0B0E14]/80 backdrop-blur-xl border border-[#3B82F6]/30 rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.2)] overflow-hidden">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/10 to-transparent pointer-events-none" />

                <div className="p-5 relative">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#3B82F6] flex items-center justify-center text-white shadow-lg shadow-[#3B82F6]/40 flex-shrink-0 animate-pulse">
                            <BellRing size={24} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest">Setup Required</span>
                            </div>
                            <h3 className="text-white font-bold text-[15px] mb-1">Link your Telegram</h3>
                            <p className="text-slate-400 text-[12px] leading-relaxed mb-4">
                                Terima notifikasi instan untuk alert penting langsung di HP kamu via Telegram.
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onOpenSettings}
                                    className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[12px] font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#3B82F6]/20"
                                >
                                    Link Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <a
                                    href="https://t.me/equilibra_notif_bot"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl bg-[#1F2937] border border-[#374151] text-white hover:bg-[#374151] transition-all"
                                    title="Open Bot"
                                >
                                    <Send size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
