import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'danger'
}) => {
    const variantStyles = {
        danger: {
            iconBg: 'bg-[#EF4444]/10',
            iconText: 'text-[#EF4444]',
            confirmBtn: 'bg-[#EF4444] hover:bg-[#DC2626]',
            border: 'border-[#EF4444]/20'
        },
        warning: {
            iconBg: 'bg-[#F59E0B]/10',
            iconText: 'text-[#F59E0B]',
            confirmBtn: 'bg-[#F59E0B] hover:bg-[#D97706]',
            border: 'border-[#F59E0B]/20'
        },
        info: {
            iconBg: 'bg-[#3B82F6]/10',
            iconText: 'text-[#3B82F6]',
            confirmBtn: 'bg-[#3B82F6] hover:bg-[#2563EB]',
            border: 'border-[#3B82F6]/20'
        }
    };

    const currentStyles = variantStyles[variant];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onCancel}>
            <div
                className={`bg-[#151A22] border ${currentStyles.border} rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${currentStyles.iconBg} ${currentStyles.iconText} shrink-0`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-white font-bold text-lg mb-1">{title}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-[#1F2937]/30 border-t border-[#374151] flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-400 hover:text-white hover:bg-[#1F2937] transition-all"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        className={`px-5 py-2 rounded-lg text-[13px] font-bold text-white shadow-lg transition-all ${currentStyles.confirmBtn}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
