import React, { useState } from 'react';
import { X, Video } from 'lucide-react';

interface MeetingFormModalProps {
  projectId: number;
  onClose: () => void;
  onSubmit: (data: {
    project_id: number;
    title: string;
    date: string;
    time: string;
    duration?: string;
  }) => Promise<void>;
}

export const MeetingFormModal: React.FC<MeetingFormModalProps> = ({ projectId, onClose, onSubmit }) => {
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2,'0')}:00`;

  const [meetingTitle, setMeetingTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [duration, setDuration] = useState('60');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;
    setSaving(true);
    await onSubmit({ project_id: projectId, title: meetingTitle.trim(), date, time, duration: `${duration}min` });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#151A22] border border-[#374151] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#374151]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1F2937] text-[#3B82F6] border border-[#374151]">
              <Video size={16} />
            </div>
            <h2 className="text-white font-semibold text-[15px]">Schedule Meeting</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Meeting Title <span className="text-[#EF4444]">*</span>
            </label>
            <input
              autoFocus
              value={meetingTitle}
              onChange={e => setMeetingTitle(e.target.value)}
              placeholder="e.g. Sprint Review Q1"
              className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#3B82F6] transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#374151] rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-[#3B82F6] transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Duration (minutes)</label>
            <div className="flex gap-2">
              {['30', '60', '90', '120'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-all ${
                    duration === d
                      ? 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/40'
                      : 'bg-[#0B0E14] text-slate-400 border-[#374151] hover:border-slate-500'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-[13px] text-slate-400 border border-[#374151] hover:text-white hover:border-slate-500 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !meetingTitle.trim()}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Scheduling…' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
