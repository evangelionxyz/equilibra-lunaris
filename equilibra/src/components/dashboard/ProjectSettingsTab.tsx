import React, { useState, useEffect } from 'react';
import { SurfaceCard } from '../../design-system/SurfaceCard';
import { Settings, Users, Plus, Search, Save, X } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { projectMemberService } from '../../services/projectMemberService';
import { userService } from '../../services/userService';
import { taskService } from '../../services/taskService';
import { useToast } from '../../design-system/Toast';
import type { Project, ProjectMember, User, Bucket } from '../../models';

interface ProjectSettingsTabProps {
    projectId: string | number;
}

export const ProjectSettingsTab: React.FC<ProjectSettingsTabProps> = ({ projectId }) => {
    const [project, setProject] = useState<Project | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Project Edit State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // Roles State
    const [roles, setRoles] = useState<string[]>([]);
    const [newRole, setNewRole] = useState('');

    // Add Member State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, m, b] = await Promise.all([
                projectService.getProjectById(projectId),
                projectMemberService.getMembers(projectId),
                taskService.getBuckets(projectId)
            ]);
            setProject(p);
            setBuckets(b);
            setName(p.name || '');
            setDescription(p.description || '');
            setRoles(p.roles || ['Owner', 'Member']); // Default fallback
            setMembers(m);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

    const handleUpdateProject = async () => {
        if (!project) return;
        try {
            const updated = await projectService.updateProject(projectId, {
                ...project,
                name,
                description,
                roles
            });
            setProject(updated);
            showToast('Project updated successfully', 'success');
        } catch (e) {
            console.error(e);
            showToast('Failed to update project', 'error');
        }
    };

    const handleAddRole = () => {
        if (newRole.trim() && !roles.includes(newRole.trim())) {
            setRoles([...roles, newRole.trim()]);
            setNewRole('');
        }
    };

    const handleRemoveRole = (role: string) => {
        setRoles(roles.filter(r => r !== role));
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const results = await userService.searchUsers(searchQuery);
                    setSearchResults(results.filter(u => !members.some(m => m.user_id === u.id)));
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, members]);

    const handleAddMember = async () => {
        if (!selectedUser || !selectedRole) return;
        try {
            await projectMemberService.createMember(projectId, {
                user_id: selectedUser.id!,
                role: selectedRole,
                max_capacity: 100,
                current_load: 0,
                kpi_score: 0
            });
            await loadData();
            setSelectedUser(null);
            setSearchQuery('');
            setSelectedRole('');
            showToast('Member added successfully', 'success');
        } catch (e) {
            console.error(e);
            showToast('Failed to add member', 'error');
        }
    };

    if (loading) {
        return <div className="text-slate-500 py-10 text-center">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            {/* General Settings */}
            <SurfaceCard title="Project Details" subtitle="Update basic project information" icon={Settings} rightElement={null}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[12px] font-medium text-slate-400 mb-1">Project Title</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-[#151A22] border border-[#374151] rounded-lg px-4 py-2 text-[14px] text-white focus:border-[#3B82F6] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-medium text-slate-400 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-[#151A22] border border-[#374151] rounded-lg px-4 py-2 text-[14px] text-white focus:border-[#3B82F6] focus:outline-none min-h-[100px]"
                        />
                    </div>
                    <div className="pt-4 border-t border-[#374151]">
                        <h4 className="text-[14px] font-bold text-white mb-4 flex items-center gap-2">
                            GitHub Integration
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[12px] font-medium text-slate-400 mb-1">Todo Bucket</label>
                                <p className="text-[11px] text-slate-500 mb-2">Tasks move here when negative feedback is received.</p>
                                <select
                                    value={project?.todo_bucket_id?.toString() || ''}
                                    onChange={e => setProject(project ? { ...project, todo_bucket_id: e.target.value ? Number(e.target.value) : undefined } : null)}
                                    className="w-full bg-[#151A22] border border-[#374151] rounded-lg px-4 py-2 text-[14px] text-white focus:border-[#3B82F6] focus:outline-none"
                                >
                                    <option value="">Select a bucket...</option>
                                    {buckets.map(b => (
                                        <option key={b.id?.toString()} value={b.id?.toString()}>{b.state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-slate-400 mb-1">In Review Bucket</label>
                                <p className="text-[11px] text-slate-500 mb-2">Tasks move here when a Pull Request is opened.</p>
                                <select
                                    value={project?.in_review_bucket_id?.toString() || ''}
                                    onChange={e => setProject(project ? { ...project, in_review_bucket_id: e.target.value ? Number(e.target.value) : undefined } : null)}
                                    className="w-full bg-[#151A22] border border-[#374151] rounded-lg px-4 py-2 text-[14px] text-white focus:border-[#3B82F6] focus:outline-none"
                                >
                                    <option value="">Select a bucket...</option>
                                    {buckets.map(b => (
                                        <option key={b.id?.toString()} value={b.id?.toString()}>{b.state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-slate-400 mb-1">Completed Bucket</label>
                                <p className="text-[11px] text-slate-500 mb-2">Tasks move here when a Pull Request is merged.</p>
                                <select
                                    value={project?.completed_bucket_id?.toString() || ''}
                                    onChange={e => setProject(project ? { ...project, completed_bucket_id: e.target.value ? Number(e.target.value) : undefined } : null)}
                                    className="w-full bg-[#151A22] border border-[#374151] rounded-lg px-4 py-2 text-[14px] text-white focus:border-[#3B82F6] focus:outline-none"
                                >
                                    <option value="">Select a bucket...</option>
                                    {buckets.map(b => (
                                        <option key={b.id?.toString()} value={b.id?.toString()}>{b.state}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleUpdateProject}
                        className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-[13px] font-bold hover:bg-[#2563EB] transition-colors"
                    >
                        <Save size={14} /> Save Changes
                    </button>
                </div>
            </SurfaceCard>

            {/* Roles Management */}
            <SurfaceCard title="Project Roles" subtitle="Manage available roles in this project" icon={Users} rightElement={null}>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {roles.map(r => (
                            <div key={r} className="flex items-center gap-2 px-3 py-1.5 bg-[#1F2937] border border-[#374151] rounded-lg text-[13px] text-white">
                                <span>{r}</span>
                                <button onClick={() => handleRemoveRole(r)} className="text-slate-400 hover:text-red-400 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newRole}
                            onChange={e => setNewRole(e.target.value)}
                            placeholder="New Role Name"
                            className="bg-[#151A22] border border-[#374151] rounded-lg px-3 py-1.5 text-[13px] text-white focus:border-[#3B82F6] focus:outline-none flex-1 max-w-[200px]"
                        />
                        <button
                            onClick={handleAddRole}
                            className="px-3 py-1.5 bg-[#374151] text-white rounded-lg text-[13px] font-semibold hover:bg-[#4B5563] disabled:opacity-50"
                            disabled={!newRole.trim()}
                        >
                            Add Role
                        </button>
                        <button
                            onClick={handleUpdateProject}
                            className="flex items-center gap-2 px-4 py-1.5 bg-[#3B82F6] text-white rounded-lg text-[13px] font-bold hover:bg-[#2563EB] transition-colors ml-auto"
                        >
                            <Save size={14} /> Save Roles
                        </button>
                    </div>
                </div>
            </SurfaceCard>

            {/* Member Management */}
            <SurfaceCard title="Project Members" subtitle={`${members.length} members in project`} icon={Users} rightElement={null}>
                <div className="space-y-6">
                    <div className="space-y-3">
                        {members.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-[#374151] bg-[#151A22]">
                                <div>
                                    <div className="text-[14px] font-medium text-white">{m.gh_username || `Unknown User (${m.user_id})`}</div>
                                    <div className="text-[12px] text-slate-400 mt-0.5">{m.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-[#374151]">
                        <h4 className="text-[14px] font-bold text-white mb-4">Add New Member</h4>

                        {!selectedUser ? (
                            <div className="space-y-2 relative">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Search size={14} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by GitHub username..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#151A22] border border-[#374151] rounded-lg pl-9 pr-4 py-2 text-[14px] text-white focus:border-[#3B82F6] focus:outline-none"
                                    />
                                    {isSearching && (
                                        <div className="absolute inset-y-0 right-3 flex items-center">
                                            <div className="w-4 h-4 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {searchQuery.length >= 2 && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1F2937] border border-[#374151] rounded-lg overflow-hidden z-10">
                                        {searchResults.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => setSelectedUser(u)}
                                                className="w-full flex items-center px-4 py-2 hover:bg-[#374151] transition-colors text-left"
                                            >
                                                <span className="text-[13px] text-white">{u.gh_username}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1F2937] border border-[#374151] rounded-lg p-3 text-[13px] text-slate-400 text-center z-10">
                                        No users found
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-[#151A22] border border-[#374151] rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[14px] font-medium text-white">Adding: {selectedUser.gh_username}</span>
                                    <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[12px] font-medium text-slate-400 mb-1">Assign Role</label>
                                    <select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="w-full bg-[#1F2937] border border-[#374151] rounded-lg px-3 py-2 text-[13px] text-white focus:border-[#3B82F6] focus:outline-none"
                                    >
                                        <option value="" disabled>Select a role</option>
                                        {roles.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleAddMember}
                                        disabled={!selectedRole}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-[#3B82F6] text-white rounded-lg text-[13px] font-bold hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
                                    >
                                        <Plus size={14} /> Add to Project
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SurfaceCard>
        </div>
    );
};
