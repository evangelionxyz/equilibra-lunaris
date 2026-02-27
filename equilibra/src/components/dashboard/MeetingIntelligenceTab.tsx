import React, { useState, useRef, useEffect } from 'react';
import { Video, Link as LinkIcon, Upload, CheckCircle2, Trash2, Save, ArrowLeft, Loader2, Sparkles, Calendar, User } from 'lucide-react';
import "../MeetingAnalyzer.css"; // Reusing established styles
import { useTasks } from '../../controllers/useTasks';
import { useMeetings } from '../../controllers/useMeetings';

interface Task {
    id: string;
    title: string;
    pic: string;
    priority: 'high' | 'medium' | 'low';
    due_date: string;
    completed: boolean;
}

interface MoMData {
    judul_meeting: string;
    ringkasan_eksekutif: string;
    poin_diskusi: string[];
    keputusan_final: string[];
}

interface AnalyzerResult {
    mom: MoMData;
    tasks: Task[];
}

interface MeetingIntelligenceTabProps {
    projectId: number;
}

export const MeetingIntelligenceTab: React.FC<MeetingIntelligenceTabProps> = ({ projectId }) => {
    const [view, setView] = useState<'choice' | 'upload' | 'link' | 'loading' | 'processing' | 'result'>('choice');
    const [meetingUrl, setMeetingUrl] = useState('');
    const [result, setResult] = useState<AnalyzerResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [synced, setSynced] = useState(false);
    const [source, setSource] = useState<'MANUAL_UPLOAD' | 'RECALL_BOT'>('MANUAL_UPLOAD');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [lastMeetingCount, setLastMeetingCount] = useState(0);

    const { createTask } = useTasks(projectId);
    const { createMeeting } = useMeetings(projectId);

    // Get current meeting count for polling reference
    const fetchMeetingCount = async () => {
        try {
            const response = await fetch('/api/meetings', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                return data.length;
            }
        } catch (err) {
            console.error("Failed to fetch meeting count", err);
        }
        return 0;
    };

    // Polling effect for background processing (Meeting Link)
    useEffect(() => {
        let interval: any;
        if (view === 'processing') {
            interval = setInterval(async () => {
                const response = await fetch('/api/meetings', { credentials: 'include' });
                if (response.ok) {
                    const meetings = await response.json();
                    if (meetings.length > lastMeetingCount) {
                        const latest = meetings[0];
                        try {
                            const momContent = JSON.parse(latest.mom_content);
                            const momData = momContent.mom || momContent;

                            const transformedTasks: Task[] = (latest.proposed_tasks || []).map((t: any, i: number) => ({
                                id: `task-bg-${i}-${Date.now()}`,
                                title: t.title,
                                pic: t.assignee_username || 'TBD',
                                priority: (t.priority?.toLowerCase() as any) || 'medium',
                                due_date: t.due_date || 'TBD',
                                completed: false
                            }));

                            setResult({
                                mom: momData,
                                tasks: transformedTasks
                            });

                            setView('result');
                            clearInterval(interval);
                        } catch (e) {
                            console.error("Failed to parse background meeting content", e);
                        }
                    }
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [view, lastMeetingCount]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setView('loading');
        setError(null);
        setSource('MANUAL_UPLOAD');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/analyze-meeting', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to analyze meeting');

            const data = await response.json();

            const transformedTasks: Task[] = (data.proposed_tasks || []).map((t: any, index: number) => ({
                id: `task-${index}-${Date.now()}`,
                title: t.title,
                pic: t.assignee_username || 'TBD',
                priority: (t.priority?.toLowerCase() as any) || 'medium',
                due_date: t.due_date || 'TBD',
                completed: false
            }));

            setResult({
                mom: data.data.mom,
                tasks: transformedTasks
            });
            setView('result');
        } catch (err: any) {
            setError(err.message || 'Something went wrong during analysis');
            setView('choice');
        }
    };

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!meetingUrl) return;

        setView('loading');
        setError(null);
        setSource('RECALL_BOT');

        try {
            const count = await fetchMeetingCount();
            setLastMeetingCount(count);

            const response = await fetch(`/api/invite-bot?meeting_url=${encodeURIComponent(meetingUrl)}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to invite bot');

            setView('processing');
            setMeetingUrl('');
        } catch (err: any) {
            setError(err.message || 'Failed to invite meeting bot');
            setView('choice');
        }
    };

    const toggleTask = (id: string) => {
        if (!result) return;
        setResult({
            ...result,
            tasks: result.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
        });
    };

    const deleteTask = (id: string) => {
        if (!result) return;
        setResult({
            ...result,
            tasks: result.tasks.filter(t => t.id !== id)
        });
    };

    const syncToProject = async () => {
        if (!result) return;
        setSyncing(true);
        try {
            // 1. Create the meeting record with full MoM data
            await createMeeting({
                project_id: projectId,
                title: result.mom.judul_meeting || 'Meeting Analysis',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duration: '60min',
                source_type: source,
                mom_summary: result.mom.poin_diskusi.join('\n'), // MeetingAccordion splits by \n
                key_decisions: result.mom.keputusan_final,
                action_items: result.tasks.filter(t => !t.completed).map(t => ({
                    task: t.title,
                    initials: t.pic.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??',
                    deadline: t.due_date
                }))
            });

            // 2. Create only uncompleted tasks on the Kanban board
            for (const task of result.tasks) {
                if (!task.completed) {
                    await createTask({
                        project_id: projectId,
                        title: task.title,
                        type: 'REQUIREMENT',
                        weight: task.priority === 'high' ? 8 : task.priority === 'medium' ? 5 : 3,
                        status: 'DRAFT'
                    });
                }
            }
            setSynced(true);
            setTimeout(() => setSynced(false), 3000);
        } catch (err) {
            console.error("Failed to sync to project", err);
            setError("Failed to sync results to project board.");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="bg-[#151A22] border border-[#374151] rounded-xl p-8 min-h-[600px] relative overflow-hidden">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#3B82F6]/5 blur-[120px] rounded-full pointer-events-none" />

            {view === 'choice' && (
                <div className="relative z-10 flex flex-col items-center justify-center h-full py-12">
                    <div className="w-16 h-16 bg-[#3B82F6]/20 rounded-2xl flex items-center justify-center text-[#3B82F6] mb-6 border border-[#3B82F6]/30 animate-pulse">
                        <Sparkles size={32} />
                    </div>
                    <h2 className="text-[28px] font-bold text-white mb-2 text-center">Meeting Intelligence</h2>
                    <p className="text-slate-400 text-[14px] text-center max-w-md mb-12">
                        Let AI transform your meeting recordings or live sessions into structured MoM and actionable tasks.
                    </p>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px] text-center w-full max-w-md flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                        <div
                            onClick={() => setView('upload')}
                            className="bg-[#1F2937]/50 border border-[#374151] hover:border-[#3B82F6] rounded-2xl p-8 cursor-pointer transition-all group hover:-translate-y-1 hover:bg-[#1F2937]/80 shadow-lg"
                        >
                            <div className="w-12 h-12 bg-[#3B82F6] rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                <Video size={24} />
                            </div>
                            <h3 className="text-white font-bold text-[18px] mb-2">Upload Video</h3>
                            <p className="text-slate-400 text-[13px] leading-relaxed">
                                Upload MP4 or WEBM recordings. Get executive summaries and task breakdowns in seconds.
                            </p>
                        </div>

                        <div
                            onClick={() => setView('link')}
                            className="bg-[#1F2937]/50 border border-[#374151] hover:border-[#8B5CF6] rounded-2xl p-8 cursor-pointer transition-all group hover:-translate-y-1 hover:bg-[#1F2937]/80 shadow-lg"
                        >
                            <div className="w-12 h-12 bg-[#8B5CF6] rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                <LinkIcon size={24} />
                            </div>
                            <h3 className="text-white font-bold text-[18px] mb-2">Meeting Link</h3>
                            <p className="text-slate-400 text-[13px] leading-relaxed">
                                Connect our AI bot to Zoom, Google Meet, or Teams. It will record and analyze the meeting live.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {view === 'upload' && (
                <div className="relative z-10">
                    <button onClick={() => setView('choice')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[14px]">Selection</span>
                    </button>

                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-[20px] font-bold text-white mb-2">Upload Recording</h3>
                        <p className="text-slate-400 text-[13px] mb-8">Select your video file to start the AI analysis pipeline.</p>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-[#374151] hover:border-[#3B82F6] rounded-2xl p-16 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#3B82F6]/5 transition-all"
                        >
                            <div className="w-16 h-16 bg-[#374151] rounded-full flex items-center justify-center text-slate-400">
                                <Upload size={32} />
                            </div>
                            <div className="text-center">
                                <p className="text-white font-semibold">Drop your file here or click to browse</p>
                                <p className="text-slate-500 text-[12px] mt-1">MP4, WEBM, MOV up to 500MB</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                hidden
                                accept="video/*,audio/*"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>
                </div>
            )}

            {view === 'link' && (
                <div className="relative z-10">
                    <button onClick={() => setView('choice')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[14px]">Selection</span>
                    </button>

                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-[20px] font-bold text-white mb-2">Invite AI Bot</h3>
                        <p className="text-slate-400 text-[13px] mb-8">Enter your live meeting URL to allow the bot to join and record.</p>

                        <form onSubmit={handleLinkSubmit} className="space-y-4">
                            <input
                                type="url"
                                required
                                placeholder="Paste Google Meet, Zoom, or Teams URL..."
                                value={meetingUrl}
                                onChange={(e) => setMeetingUrl(e.target.value)}
                                className="w-full bg-[#0B0E14] border border-[#374151] rounded-xl px-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#8B5CF6] transition-all shadow-inner"
                            />
                            <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-bold shadow-lg hover:shadow-[#8B5CF6]/20 transition-all flex items-center justify-center gap-2">
                                <Sparkles size={18} />
                                Invite Bot to Meeting
                            </button>

                        </form>
                    </div>
                </div>
            )}

            {(view === 'loading' || view === 'processing') && (
                <div className="relative z-10 flex flex-col items-center justify-center h-[500px]">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 border-4 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-[#3B82F6]">
                            <Loader2 size={32} className="animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-white font-bold text-[20px] mb-2">{view === 'loading' ? 'Analyzing Meeting Content' : 'Bot is Recording Live'}</h3>
                    <p className="text-slate-400 text-[14px] text-center max-w-sm">
                        {view === 'loading'
                            ? 'Our AI is transcribing audio and extracting key decision points. Please wait...'
                            : 'The AI bot is currently in your meeting. Once the meeting ends, analysis will appear here automatically.'}
                    </p>
                    {view === 'processing' && (
                        <div className="mt-8 flex gap-3">
                            <div className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full border border-red-500/20 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                LIVE RECORDING
                            </div>
                            <div className="px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] font-bold rounded-full border border-[#3B82F6]/20">
                                POLLING FOR END
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view === 'result' && result && (
                <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <button onClick={() => setView('choice')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-[13px] mb-2">
                                <ArrowLeft size={14} /> Back to Selection
                            </button>
                            <h2 className="text-[24px] font-bold text-white flex items-center gap-3">
                                {result.mom.judul_meeting}
                                <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-widest">Analyzed</span>
                            </h2>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={syncToProject}
                                disabled={syncing || synced}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] transition-all shadow-lg ${synced
                                    ? 'bg-green-500 text-white'
                                    : 'bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:scale-105 active:scale-95 disabled:opacity-50'
                                    }`}
                            >
                                {syncing ? <Loader2 size={16} className="animate-spin" /> : synced ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                {syncing ? 'Syncing...' : synced ? 'Synced' : 'Sync to Project Board'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* MoM Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-[#1F2937]/30 border border-[#374151] rounded-2xl p-6">
                                <h4 className="text-[#3B82F6] text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Sparkles size={14} /> Executive Summary
                                </h4>
                                <p className="text-slate-300 leading-relaxed text-[15px]">
                                    {result.mom.ringkasan_eksekutif}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#1F2937]/30 border border-[#374151] rounded-2xl p-6">
                                    <h4 className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Key Discussion Points</h4>
                                    <ul className="space-y-3">
                                        {result.mom.poin_diskusi.map((pt, i) => (
                                            <li key={i} className="flex gap-3 text-[13px] text-slate-300">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
                                                {pt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-[#1F2937]/30 border border-[#374151] rounded-2xl p-6">
                                    <h4 className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Final Decisions</h4>
                                    <ul className="space-y-3">
                                        {result.mom.keputusan_final.map((dec, i) => (
                                            <li key={i} className="flex gap-3 text-[13px] text-slate-300">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                {dec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Tasks Section */}
                        <div className="space-y-6">
                            <div className="bg-[#1F2937]/50 border border-[#374151] rounded-2xl p-6 flex flex-col h-full min-h-[400px]">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-white font-bold text-[16px]">Proposed Tasks</h4>
                                    <span className="bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] px-2 py-0.5 rounded-full border border-[#3B82F6]/20">
                                        {result.tasks.length} Items
                                    </span>
                                </div>

                                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[460px]">
                                    {result.tasks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                                            <CheckCircle2 size={32} className="opacity-20" />
                                            <p className="text-[12px]">All clear! No tasks identified.</p>
                                        </div>
                                    ) : (
                                        result.tasks.map(task => (
                                            <div
                                                key={task.id}
                                                className={`group relative p-4 rounded-xl border border-[#374151] transition-all hover:bg-[#1F2937] ${task.completed ? 'opacity-50' : 'bg-[#0B0E14]/40'}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        onClick={() => toggleTask(task.id)}
                                                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${task.completed
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : 'border-[#374151] hover:border-[#3B82F6]'
                                                            }`}
                                                    >
                                                        {task.completed && <CheckCircle2 size={12} />}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-[13px] font-semibold text-white leading-snug ${task.completed ? 'line-through text-slate-500' : ''}`}>
                                                            {task.title}
                                                        </p>
                                                        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
                                                            <span className="flex items-center gap-1"><User size={10} /> {task.pic}</span>
                                                            <span className="flex items-center gap-1"><Calendar size={10} /> {task.due_date}</span>
                                                            <span className={`px-1.5 py-0.5 rounded border ${task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                    'bg-green-500/10 text-green-500 border-green-500/20'
                                                                }`}>
                                                                {task.priority}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteTask(task.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
