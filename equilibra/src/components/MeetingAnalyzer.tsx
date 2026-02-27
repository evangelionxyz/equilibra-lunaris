import React, { useState, useRef } from 'react';
import './MeetingAnalyzer.css';

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

export const MeetingAnalyzer: React.FC = () => {
    const [view, setView] = useState<'choice' | 'upload' | 'link' | 'loading' | 'processing' | 'result'>('choice');
    const [meetingUrl, setMeetingUrl] = useState('');
    const [result, setResult] = useState<AnalyzerResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [lastMeetingCount, setLastMeetingCount] = useState(0);

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

    // Polling effect
    React.useEffect(() => {
        let interval: any;
        if (view === 'processing') {
            interval = setInterval(async () => {
                const response = await fetch('/api/meetings', { credentials: 'include' });
                if (response.ok) {
                    const meetings = await response.json();
                    if (meetings.length > lastMeetingCount) {
                        // New meeting detected!
                        const latest = meetings[0]; // Assuming order is newest first or we just take the first
                        // Or better: find the meeting that wasn't there before

                        try {
                            const momContent = JSON.parse(latest.mom_content);
                            const momData = momContent.mom || momContent;

                            // Map tasks from the meeting object's proposed_tasks
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

        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', '0'); // Fallback project_id

        try {
            const response = await fetch('/api/analyze-meeting', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to analyze meeting');

            const data = await response.json();

            // Transform backend data to our frontend state
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

        try {
            // First get current count
            const count = await fetchMeetingCount();
            setLastMeetingCount(count);

            const response = await fetch(`/api/invite-bot?meeting_url=${encodeURIComponent(meetingUrl)}&project_id=0`, {
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

    return (
        <div className="meeting-analyzer-container">
            {view === 'choice' && (
                <>
                    <h1 className="meeting-analyzer-title">Meeting Intelligence</h1>
                    <p className="meeting-analyzer-subtitle">Transform your conversations into actionable insights with AI</p>

                    {error && <div style={{ color: 'var(--cmd-danger)', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

                    <div className="choice-grid">
                        <div className="choice-card" onClick={() => setView('upload')}>
                            <div className="icon-wrapper">🎥</div>
                            <h3>Upload Video</h3>
                            <p>Upload a recording (MP4, MKV) to get an instant MoM and task list.</p>
                        </div>
                        <div className="choice-card" onClick={() => setView('link')}>
                            <div className="icon-wrapper">🔗</div>
                            <h3>Meeting Link</h3>
                            <p>Invite our AI Bot to your live Zoom, Google Meet, or Teams meeting.</p>
                        </div>
                    </div>
                </>
            )}

            {view === 'upload' && (
                <div className="form-container">
                    <button className="back-button" onClick={() => setView('choice')}>← Back</button>
                    <h3>Upload Meeting Recording</h3>
                    <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                        <p>Click or drag your video file here</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--cmd-text-meta)' }}>Supported formats: MP4, MOV, AVI, WEBM</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="video/*,audio/*"
                            onChange={handleFileUpload}
                        />
                    </div>
                </div>
            )}

            {view === 'link' && (
                <div className="form-container">
                    <button className="back-button" onClick={() => setView('choice')}>← Back</button>
                    <h3>Invite Bot to Meeting</h3>
                    <form onSubmit={handleLinkSubmit} className="input-group">
                        <input
                            type="url"
                            className="url-input"
                            placeholder="Paste Zoom, Meet, or Teams URL here..."
                            value={meetingUrl}
                            onChange={(e) => setMeetingUrl(e.target.value)}
                            required
                        />
                        <button type="submit" className="submit-btn">Invite AI Bot</button>
                    </form>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--cmd-text-meta)', textAlign: 'center' }}>
                        The bot will join shortly and analyze the meeting audio in real-time.
                    </p>
                </div>
            )}

            {view === 'loading' && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <h2>Connecting to meeting service...</h2>
                </div>
            )}

            {view === 'processing' && (
                <div className="in-meeting-status">
                    <span className="status-badge">Live Meeting</span>
                    <div className="pulse-icon">🤖</div>
                    <h2>Our AI Bot is currently in the meeting</h2>
                    <p>Once the meeting ends and the bot leaves, your analysis will appear here automatically.</p>
                    <p style={{ marginTop: '1rem', color: 'var(--cmd-text-meta)', fontSize: '0.9rem' }}>
                        Polling for results...
                    </p>
                    <button className="back-button" onClick={() => setView('choice')} style={{ margin: '2rem auto 0' }}>
                        Cancel and Go Back
                    </button>
                </div>
            )}

            {view === 'result' && result && (
                <div className="result-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button className="back-button" onClick={() => setView('choice')}>← New Analysis</button>
                        <span style={{ color: 'var(--cmd-success)', fontWeight: 600 }}>✨ AI Analysis Complete</span>
                    </div>

                    <div className="mom-card">
                        <div className="mom-header">
                            <h2>{result.mom.judul_meeting}</h2>
                        </div>

                        <div className="mom-section" style={{ marginBottom: '2rem' }}>
                            <h4>Executive Summary</h4>
                            <p>{result.mom.ringkasan_eksekutif}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div className="mom-section">
                                <h4>Discussion Points</h4>
                                <ul className="mom-list">
                                    {result.mom.poin_diskusi.map((pt, i) => <li key={i}>{pt}</li>)}
                                </ul>
                            </div>
                            <div className="mom-section">
                                <h4>Key Decisions</h4>
                                <ul className="mom-list">
                                    {result.mom.keputusan_final.map((dec, i) => <li key={i}>{dec}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="tasks-card">
                        <h3>Action Items</h3>
                        {result.tasks.length === 0 ? (
                            <p style={{ color: 'var(--cmd-text-meta)' }}>No tasks identified from this meeting.</p>
                        ) : (
                            result.tasks.map(task => (
                                <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                                    <div className="checkbox-custom" onClick={() => toggleTask(task.id)}>
                                        {task.completed && '✓'}
                                    </div>
                                    <div className="task-info">
                                        <span className="task-text">{task.title}</span>
                                        <div className="task-meta">
                                            <span>👤 {task.pic}</span>
                                            <span>📅 {task.due_date}</span>
                                            <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                                        </div>
                                    </div>
                                    <button className="delete-btn" onClick={() => deleteTask(task.id)}>🗑️</button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
