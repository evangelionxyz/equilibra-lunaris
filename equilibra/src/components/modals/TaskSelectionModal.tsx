import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, BotMessageSquare, CheckSquare, Square, AlertCircle, Loader2 } from 'lucide-react';
import { alertService } from '../../services/alertService';
import type { ProjectMember, ExtractedTask, ExtractedTaskPayload } from '../../models';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  alertId: number;
  projectId: number;
  extractedTasks: ExtractedTask[];
  members: ProjectMember[];
  onSuccess?: () => void;
}

// ─── Weight pill colours ─────────────────────────────────────────────────────

const WEIGHT_COLORS: Record<number, string> = {
  1: 'bg-slate-700/60 text-slate-300 border-slate-600',
  2: 'bg-[#1E3A5F]/60 text-[#60A5FA] border-[#1D4ED8]/40',
  3: 'bg-[#312E81]/60 text-[#A78BFA] border-[#4F46E5]/40',
  4: 'bg-[#3B1F6E]/60 text-[#C084FC] border-[#7C3AED]/40',
  5: 'bg-[#5B1010]/60 text-[#FCA5A5] border-[#DC2626]/40',
};

const weightColor = (w?: number) =>
  WEIGHT_COLORS[Math.min(Math.max(w ?? 3, 1), 5)] ?? WEIGHT_COLORS[3];

// ─── Component ───────────────────────────────────────────────────────────────

export const TaskSelectionModal: React.FC<TaskSelectionModalProps> = ({
  isOpen,
  onClose,
  alertId,
  projectId,
  extractedTasks,
  members,
  onSuccess,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(extractedTasks.map((_, i) => i)),
  );
  const [assignees, setAssignees] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggle = (idx: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIndices(prev =>
      prev.size === extractedTasks.length
        ? new Set()
        : new Set(extractedTasks.map((_, i) => i)),
    );
  };

  const handleAssigneeChange = (taskIdx: number, userId: number) => {
    setAssignees(prev => ({ ...prev, [taskIdx]: userId }));
  };

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);

    const tasksToSubmit: ExtractedTaskPayload[] = extractedTasks
      .map((t, i) => ({ task: t, origIndex: i }))
      .filter(({ origIndex }) => selectedIndices.has(origIndex))
      .map(({ task, origIndex }) => ({
        title: task.title,
        description: task.description,
        type: task.type ?? 'OTHER',
        weight: task.weight ?? 3,
        assignee_id: assignees[origIndex],
      }));

    try {
      await alertService.confirmTasks(alertId, projectId, tasksToSubmit);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const allSelected = selectedIndices.size === extractedTasks.length;
  const noneSelected = selectedIndices.size === 0;

  // Check if any *selected* task is missing an assignee
  const hasMissingAssignees = Array.from(selectedIndices).some(
    idx => !assignees[idx]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-[#0B0E14] border border-[#374151] rounded-2xl w-full max-w-xl shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200 max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ─── Header ─────────────────────────────────────── */}
        <div className="p-6 border-b border-[#374151] bg-[#8B5CF6]/10 flex items-start gap-4 flex-shrink-0">
          <div className="p-3 rounded-xl bg-[#8B5CF6]/20 text-[#A78BFA]">
            <BotMessageSquare size={22} />
          </div>
          <div className="flex-1 mt-0.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#A78BFA] mb-1">
              AI Extracted Tasks
            </p>
            <h2 className="text-white font-bold text-[18px] leading-snug">
              Review &amp; Confirm Tasks
            </h2>
            <p className="text-slate-400 text-[12px] mt-1">
              {selectedIndices.size} of {extractedTasks.length} tasks selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-[#1F2937] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Select-all bar ──────────────────────────────── */}
        <div className="px-6 py-3 border-b border-[#1F2937] bg-[#0D1017] flex items-center justify-between flex-shrink-0">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-[12px] font-semibold text-slate-400 hover:text-white transition-colors"
          >
            {allSelected ? (
              <CheckSquare size={15} className="text-[#8B5CF6]" />
            ) : (
              <Square size={15} />
            )}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-[11px] text-slate-500">
            {extractedTasks.length} task{extractedTasks.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {/* ─── Task list ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {extractedTasks.map((task, idx) => {
            const selected = selectedIndices.has(idx);
            const w = task.weight ?? 3;

            return (
              <button
                key={idx}
                onClick={() => toggle(idx)}
                className={`w-full text-left rounded-xl border p-4 transition-all duration-150 flex gap-3 group ${
                  selected
                    ? 'bg-[#151A22] border-[#4F46E5]/60 shadow-[0_0_0_1px_rgba(79,70,229,0.2)]'
                    : 'bg-[#0D1017] border-[#1F2937] hover:border-[#374151]'
                }`}
              >
                {/* Checkbox icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {selected ? (
                    <CheckSquare size={16} className="text-[#8B5CF6]" />
                  ) : (
                    <Square size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-white text-[13px] font-semibold leading-snug">
                      {task.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${weightColor(w)}`}
                    >
                      W{w}
                    </span>
                    {task.type && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1F2937] text-slate-400 border border-[#374151]">
                        {task.type}
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-slate-400 text-[12px] leading-relaxed line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {task.reason && (
                    <p className="mt-1.5 text-[11px] text-[#A78BFA]/70 italic line-clamp-1">
                      ↳ {task.reason}
                    </p>
                  )}

                  {/* Assignee Dropdown */}
                  {selected && (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                      <select
                        value={assignees[idx] || ''}
                        onChange={e => handleAssigneeChange(idx, Number(e.target.value))}
                        className={`w-full bg-[#1F2937] border ${
                          !assignees[idx] ? 'border-[#EF4444]' : 'border-[#374151]'
                        } text-white text-[12px] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#8B5CF6] transition-colors`}
                      >
                        <option value="" disabled>Select Assignee...</option>
                        {members.map(m => (
                          <option key={m.user_id} value={m.user_id}>
                            Member #{m.user_id} ({m.role})
                          </option>
                        ))}
                      </select>
                      {!assignees[idx] && (
                        <p className="text-[#EF4444] text-[10px] mt-1">Assignee is required</p>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── Error banner ────────────────────────────────── */}
        {error && (
          <div className="mx-4 mb-0 mt-2 flex items-start gap-3 px-4 py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex-shrink-0">
            <AlertCircle size={15} className="text-[#EF4444] mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-[#FCA5A5] leading-snug">{error}</p>
          </div>
        )}

        {/* ─── Footer ──────────────────────────────────────── */}
        <div className="p-5 border-t border-[#1F2937] flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-[13px] text-slate-400 border border-[#374151] hover:text-white hover:border-slate-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || noneSelected || hasMissingAssignees}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </>
            ) : (
              `Confirm ${selectedIndices.size} Task${selectedIndices.size !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
