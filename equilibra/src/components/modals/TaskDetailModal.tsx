import React, { useState, useEffect } from 'react';
import { X, CheckSquare, AlignLeft, Tag, GitPullRequest, Activity } from 'lucide-react';
import type { Task, TaskType, Bucket, ProjectMember } from '../../models';

interface TaskDetailModalProps {
    task: Task;
    buckets: Bucket[];
    members: ProjectMember[];
    onClose: () => void;
    onUpdate: (taskId: number | string, data: Partial<Task>) => Promise<void>;
}

const TASK_TYPES: TaskType[] = ['CODE', 'REQUIREMENT', 'DESIGN', 'NON-CODE', 'OTHER'];
const TASK_WEIGHTS = [1, 2, 3, 5, 8]; // Fibonacci sequence for story points

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
    task, buckets, members, onClose, onUpdate
}) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [type, setType] = useState<TaskType>(task.type);
    const [weight, setWeight] = useState<string | number>(task.weight);
    const [bucketId, setBucketId] = useState<number | string | undefined>(task.bucket_id);
    const [leadAssigneeId, setLeadAssigneeId] = useState<number | string | undefined>(task.lead_assignee_id);
    const [branchName, setBranchName] = useState(task.branch_name || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setType(task.type);
        setWeight(task.weight);
        setBucketId(task.bucket_id);
        setLeadAssigneeId(task.lead_assignee_id);
        setBranchName(task.branch_name || '');
    }, [task]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !task.id) return;

        setSaving(true);
        await onUpdate(String(task.id), {
            title: title.trim(),
            description: description.trim() || undefined,
            type,
            weight: Number(weight),
            bucket_id: bucketId ? String(bucketId) : undefined,
            lead_assignee_id: leadAssigneeId ? String(leadAssigneeId) : undefined,
            branch_name: branchName.trim() || undefined,
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#151A22] border border-[#374151] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-start flex-col gap-3 p-6 border-b border-[#374151] relative">
                    <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors p-1"><X size={20} /></button>
                    <div className="flex items-center gap-3 w-full pr-10">
                        <div className="p-2 rounded-lg bg-[#1F2937] text-[#3B82F6] border border-[#374151] shrink-0">
                            <CheckSquare size={20} />
                        </div>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task Title"
                            className="bg-transparent text-white font-bold text-xl w-full focus:outline-none focus:ring-1 focus:ring-[#3B82F6] rounded px-2 py-1 -ml-2 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-400 ml-12">
                        <span>In project list</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>Task ID: #{String(task.id)}</span>
                    </div>
                </div>

                {/* Form Body - Scrollable */}
                <form id="task-detail-form" onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto flex gap-8">

                    {/* Main Content (Left) */}
                    <div className="flex-1 space-y-8">
                        {/* Description */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold">
                                <AlignLeft size={16} />
                                <h3>Description</h3>
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a more detailed description..."
                                className="w-full h-32 bg-[#0B0E14] border border-[#374151] rounded-lg px-4 py-3 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-all resize-y"
                            />
                        </div>

                        {/* Git Branch / PR */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-slate-300 font-semibold">
                                <GitPullRequest size={16} />
                                <h3>Development</h3>
                            </div>
                            <div className="bg-[#0B0E14] border border-[#374151] rounded-lg p-4 space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Branch Name</label>
                                    <input
                                        value={branchName}
                                        onChange={(e) => setBranchName(e.target.value)}
                                        placeholder="e.g. feature/auth-roles"
                                        className="w-full bg-[#151A22] border border-[#374151] rounded-lg px-3 py-2 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-[#3B82F6] transition-all"
                                    />
                                </div>
                                {task.prUrl && (
                                    <div className="text-[12px]">
                                        <span className="text-slate-400">Pull Request: </span>
                                        <a href={task.prUrl} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">{task.prUrl}</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="w-64 space-y-6 shrink-0">

                        {/* Bucket (State) */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Activity size={14} /> State Group</label>
                            <select
                                value={bucketId ? String(bucketId) : ''}
                                onChange={(e) => setBucketId(e.target.value ? String(e.target.value) : undefined)}
                                className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
                            >
                                <option value="" disabled>Select Bucket...</option>
                                {buckets.map(b => (
                                    <option key={String(b.id)} value={b.id ? String(b.id) : ''}>{b.state}</option>
                                ))}
                            </select>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Tag size={14} /> Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as TaskType)}
                                className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
                            >
                                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Weight / Story Points</label>
                            <select
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
                            >
                                {TASK_WEIGHTS.map(w => <option key={w} value={w}>{w} Points</option>)}
                            </select>
                        </div>

                        {/* Lead Assignee */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Lead Assignee</label>
                            <select
                                value={leadAssigneeId ? String(leadAssigneeId) : ''}
                                onChange={(e) => setLeadAssigneeId(e.target.value ? String(e.target.value) : undefined)}
                                className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#3B82F6] transition-colors"
                            >
                                <option value="">Unassigned</option>
                                {members.map(m => (
                                    <option key={String(m.id)} value={m.id ? String(m.id) : ''}>{m.gh_username || `Member #${m.user_id}`}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-[#374151] flex justify-end gap-3 bg-[#111827] rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-[#1F2937] transition-all">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="task-detail-form"
                        disabled={saving || !title.trim()}
                        className="px-6 py-2 rounded-lg text-[13px] font-bold bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
};
