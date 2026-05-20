"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Save, Loader2, ShieldCheck, Key, User, Plus, Trash2, 
  Edit, X, Palette, RotateCcw, DatabaseBackup, Download, 
  ExternalLink, Upload, AlertTriangle, ArchiveRestore 
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const THEME_PRESETS = [
  { name: 'Default Indigo', colors: { background: '#FDFDFF', card: '#FFFFFF', primary: '#4f46e5', text: '#08060d', sidebar: '#111C44' } },
  { name: 'Ocean Blue', colors: { background: '#F0F9FF', card: '#FFFFFF', primary: '#0ea5e9', text: '#0f172a', sidebar: '#0c4a6e' } },
  { name: 'Crimson Red', colors: { background: '#FFF1F2', card: '#FFFFFF', primary: '#e11d48', text: '#4c0519', sidebar: '#4c0519' } },
  { name: 'Emerald Green', colors: { background: '#ECFDF5', card: '#FFFFFF', primary: '#10b981', text: '#064e3b', sidebar: '#022c22' } },
  { name: 'Amber Gold', colors: { background: '#FFFBEB', card: '#FFFFFF', primary: '#f59e0b', text: '#451a03', sidebar: '#451a03' } },
  { name: 'Midnight Purple', colors: { background: '#F5F3FF', card: '#FFFFFF', primary: '#7c3aed', text: '#2e1065', sidebar: '#2e1065' } },
];

const DARK_THEME_PRESETS = [
  { name: 'Deep Indigo', colors: { background: '#0f172a', card: '#1e293b', primary: '#6366f1', text: '#f8fafc' } },
  { name: 'Abyss Blue', colors: { background: '#020617', card: '#0f172a', primary: '#3b82f6', text: '#f1f5f9' } },
  { name: 'Volcano Red', colors: { background: '#2e020f', card: '#4c0519', primary: '#f43f5e', text: '#fff1f2' } },
  { name: 'Forest Green', colors: { background: '#022c22', card: '#064e3b', primary: '#10b981', text: '#ecfdf5' } },
  { name: 'Ember Dark', colors: { background: '#451a03', card: '#78350f', primary: '#f97316', text: '#fffbeb' } },
  { name: 'Void Purple', colors: { background: '#2e1065', card: '#4c1d95', primary: '#8b5cf6', text: '#f5f3ff' } },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('ID & Password');
  
  // Theme & Colors State
  const [themeColors, setThemeColors] = useState({
    background: typeof window !== 'undefined' ? localStorage.getItem('theme-bg') || '#FDFDFF' : '#FDFDFF',
    card: typeof window !== 'undefined' ? localStorage.getItem('theme-card') || '#FFFFFF' : '#FFFFFF',
    primary: typeof window !== 'undefined' ? localStorage.getItem('theme-primary') || '#4f46e5' : '#4f46e5',
    text: typeof window !== 'undefined' ? localStorage.getItem('theme-text') || '#08060d' : '#08060d',
    sidebar: typeof window !== 'undefined' ? localStorage.getItem('theme-sidebar') || '#111C44' : '#111C44'
  });

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(`${API_BASE_URL}/uploads/system/logo.webp`);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'teacher' });
  const [savingUser, setSavingUser] = useState(false);
  
  const [userPhoto, setUserPhoto] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);
  const userPhotoRef = useRef(null);

  // Backup State
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  
  // Restore State
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [revertLoading, setRevertLoading] = useState(false);
  const [isRestoredMode, setIsRestoredMode] = useState(false);
  const restoreFileRef = useRef(null);

  // --- Theme Methods ---
  const handleColorChange = (name, value) => {
    setThemeColors(prev => ({ ...prev, [name]: value }));
    const varName = name === 'background' ? '--live-bg' : name === 'card' ? '--live-card' : name === 'text' ? '--live-text' : name === 'sidebar' ? '--live-sidebar' : '--live-primary';
    document.documentElement.style.setProperty(varName, value);
  };

  const applyPreset = (colors) => {
    setThemeColors(colors);
    document.documentElement.style.setProperty('--live-bg', colors.background);
    document.documentElement.style.setProperty('--live-card', colors.card);
    document.documentElement.style.setProperty('--live-primary', colors.primary);
    document.documentElement.style.setProperty('--live-text', colors.text);
    document.documentElement.style.setProperty('--live-sidebar', colors.sidebar || '#111C44');
  };

  const saveThemeColors = () => {
    localStorage.setItem('theme-bg', themeColors.background);
    localStorage.setItem('theme-card', themeColors.card);
    localStorage.setItem('theme-primary', themeColors.primary);
    localStorage.setItem('theme-text', themeColors.text);
    localStorage.setItem('theme-sidebar', themeColors.sidebar);
    toast.success('Theme colors saved successfully!');
    setTimeout(() => window.location.reload(), 1000);
  };

  const resetThemeColors = () => {
    if (window.confirm("Are you sure you want to reset to default colors?")) {
      const defaultColors = { background: '#FDFDFF', card: '#FFFFFF', primary: '#4f46e5', text: '#08060d', sidebar: '#111C44' };
      setThemeColors(defaultColors);
      localStorage.setItem('theme-bg', defaultColors.background);
      localStorage.setItem('theme-card', defaultColors.card);
      localStorage.setItem('theme-primary', defaultColors.primary);
      localStorage.setItem('theme-text', defaultColors.text);
      localStorage.setItem('theme-sidebar', defaultColors.sidebar);
      window.location.reload();
    }
  };

  // --- Profile Methods ---
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSavePhoto = async () => {
    if (!photo) { toast.error("Please select a photo first!"); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append("photo", photo);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/photo`, { method: 'POST', body: fd });
      if(res.ok) {
        toast.success("Admin profile photo updated successfully!");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload failed");
      }
    } catch (error) {
      toast.error("Error updating photo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- User Methods ---
  useEffect(() => {
    if (activeTab === 'ID & Password') fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/`);
      if(res.ok) setUsers(await res.json());
      else setUsers([]);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, password: user.password, role: user.role });
      setUserPhotoPreview(`${API_BASE_URL}/uploads/profiles/${user.username}.jpg?t=${new Date().getTime()}`);
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'teacher' });
      setUserPhotoPreview(null);
    }
    setUserPhoto(null);
    setIsModalOpen(true);
  };

  const handleUserPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserPhoto(file);
      setUserPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `${API_BASE_URL}/users/${editingUser.id}` : `${API_BASE_URL}/users/`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if(!res.ok) throw new Error("Failed to save user");
      
      if (userPhoto) {
        const fd = new FormData();
        fd.append("photo", userPhoto);
        await fetch(`${API_BASE_URL}/users/${formData.username}/photo`, {
          method: 'POST',
          body: fd
        });
      }
      
      setIsModalOpen(false);
      fetchUsers();
      toast.success(editingUser ? "User updated successfully!" : "User added successfully!");
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.username === 'admin') { toast.error("Cannot delete super admin!"); return; }
    if (window.confirm(`Are you sure you want to delete user '${user.username}'?`)) {
      try {
        await fetch(`${API_BASE_URL}/users/${user.id}`, { method: 'DELETE' });
        fetchUsers();
        toast.success("User deleted successfully!");
      } catch (err) {
        toast.error("Error deleting user");
      }
    }
  };

  // --- Backup & Restore Methods ---
  const fetchBackupStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/backup/status`);
      if(res.ok) {
        const data = await res.json();
        setLastBackupDate(data.last_backup_date);
        setIsRestoredMode(data.is_restored);
      }
    } catch (err) { console.error("Backup status fetch error", err); }
  };

  useEffect(() => {
    if (activeTab === 'Backup' || activeTab === 'Restore') {
      fetchBackupStatus();
    }
  }, [activeTab]);

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/backup/create`, { method: 'POST' });
      if(!response.ok) throw new Error("Backup failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'school_backup.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setIsBackupModalOpen(true);
      fetchBackupStatus();
    } catch (error) {
      toast.error('Backup API not connected yet. Please implement backend.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm("Are you sure you want to load this old backup?\nYour current live data will be safely paused.")) {
      e.target.value = null; return;
    }
    setRestoreLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_BASE_URL}/backup/restore/temp`, { method: 'POST', body: fd });
      if(!res.ok) throw new Error("Restore failed");
      toast.success("Old database loaded successfully!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error("Restore API not connected yet.");
    } finally {
      setRestoreLoading(false);
      e.target.value = null;
    }
  };

  const handleRevert = async () => {
    if (!window.confirm("Are you sure you want to return to the live database?")) return;
    setRevertLoading(true);
    try {
      await fetch(`${API_BASE_URL}/backup/restore/revert`, { method: 'POST' });
      toast.success("Reverted to live database successfully!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error("Revert failed.");
    } finally {
      setRevertLoading(false);
    }
  };

  return (
    <div className="animate-in font-sans">
      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 border-b border-gray-100 dark:border-border-dark pb-4">
        {['ID & Password', 'Profile Picture', 'Theme & Colors', 'Backup', 'Restore'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                : 'bg-white dark:bg-background-dark text-slate-500 hover:bg-gray-50 dark:hover:bg-border-dark border border-gray-100 dark:border-border-dark hover:text-primary'
            }`}
          >
            {tab === 'ID & Password' && <Key size={16} />}
            {tab === 'Profile Picture' && <Camera size={16} />}
            {tab === 'Theme & Colors' && <Palette size={16} />}
            {tab === 'Backup' && <DatabaseBackup size={16} />}
            {tab === 'Restore' && <ArchiveRestore size={16} />}
            {tab}
          </button>
        ))}
      </div>

      {/* ID & Password Tab */}
      {activeTab === 'ID & Password' && (
        <div className="bg-white dark:bg-background-dark rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-border-dark animate-in fade-in zoom-in duration-300 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-heading dark:text-heading-dark mb-1">User Management</h3>
              <p className="text-text-secondary dark:text-text-dark font-medium text-sm">Manage login credentials and roles for all school staff.</p>
            </div>
            <button onClick={() => openUserModal()} className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all shrink-0">
              <Plus size={18} /> Add New User
            </button>
          </div>

          {usersLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" size={30} /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-border-dark">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-background-darker border-b border-gray-100 dark:border-border-dark">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider pl-6">Username</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Password</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-background-darker/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          <img src={`${API_BASE_URL}/uploads/profiles/${user.username}.jpg?t=${new Date().getTime()}`} onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${user.username}&background=4f46e5&color=fff`; }} alt="User" className="h-full w-full object-cover" />
                        </div> {user.username}
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-500">{user.password}</td>
                      <td className="p-4">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                          {user.role === 'super_admin' ? 'Admin / Principal' : 
                           user.role === 'accountant' ? 'Accountant' : 
                           user.role === 'exam' ? 'Exam Coordinator' : 
                           user.role}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button onClick={() => openUserModal(user)} className="p-2 text-gray-400 hover:text-primary bg-gray-50 hover:bg-blue-50 dark:bg-border-dark dark:hover:bg-border-dark/80 rounded-lg mr-2 transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                        {user.username !== 'admin' && (
                          <button onClick={() => handleDeleteUser(user)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 dark:bg-border-dark dark:hover:bg-border-dark/80 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Theme & Colors Tab */}
      {activeTab === 'Theme & Colors' && (
        <div className="bg-white dark:bg-background-dark rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-border-dark animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-border-dark">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl"><Palette size={28} /></div>
            <div>
              <h3 className="text-xl font-bold text-heading dark:text-heading-dark">Theme & Colors</h3>
              <p className="text-sm font-medium text-text-secondary dark:text-text-dark mt-1">Customize live app appearance</p>
            </div>
          </div>

          <h4 className="text-sm font-bold text-heading dark:text-heading-dark mb-4 uppercase tracking-widest">Presets</h4>
          <div className="flex flex-wrap gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-border-dark">
            {THEME_PRESETS.map((preset) => (
              <button key={preset.name} onClick={() => applyPreset(preset.colors)} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background-darker hover:border-primary transition-all group">
                <span className="w-5 h-5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: preset.colors.primary }}></span>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{preset.name}</span>
              </button>
            ))}
          </div>

          <h4 className="text-sm font-bold text-heading dark:text-heading-dark mb-4 uppercase tracking-widest">Custom Colors</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <ColorPickerItem label="App Background" name="background" value={themeColors.background} onChange={handleColorChange} />
            <ColorPickerItem label="Card & Box Background" name="card" value={themeColors.card} onChange={handleColorChange} />
            <ColorPickerItem label="Primary Accent" name="primary" value={themeColors.primary} onChange={handleColorChange} />
            <ColorPickerItem label="Primary Text Color" name="text" value={themeColors.text} onChange={handleColorChange} />
            <ColorPickerItem label="Sidebar Background" name="sidebar" value={themeColors.sidebar} onChange={handleColorChange} />
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-border-dark">
            <button onClick={saveThemeColors} className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <Save size={18} /> Save Theme
            </button>
            <button onClick={resetThemeColors} className="px-6 py-3 rounded-xl font-bold bg-gray-100 dark:bg-background-darker text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-border-dark transition-all flex items-center justify-center gap-2">
              <RotateCcw size={18} /> Reset
            </button>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'Backup' && (
        <div className="bg-white dark:bg-background-dark rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-border-dark animate-in fade-in zoom-in duration-300">
           <div className="text-center p-10 bg-gray-50 dark:bg-background-darker rounded-2xl border border-gray-100 dark:border-border-dark">
            <DatabaseBackup size={48} className="mx-auto text-primary mb-4" />
            <h3 className="text-xl font-bold text-heading dark:text-heading-dark mb-2">Database Backup</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create and download a secure backup of the entire school database. Last backup: {lastBackupDate ? new Date(lastBackupDate).toLocaleDateString() : 'Never'}
            </p>
            <button onClick={handleCreateBackup} disabled={backupLoading} className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-70">
              {backupLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {backupLoading ? "Creating Backup..." : "Create & Download Backup"}
            </button>
          </div>
        </div>
      )}

      {/* Restore Tab */}
      {activeTab === 'Restore' && (
        <div className="bg-white dark:bg-background-dark rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-border-dark animate-in fade-in zoom-in duration-300">
          <div className="p-8 bg-gray-50 dark:bg-background-darker rounded-2xl border border-gray-100 dark:border-border-dark text-center">
            <ArchiveRestore size={48} className="mx-auto text-warning mb-4" />
            <h3 className="text-xl font-bold text-heading dark:text-heading-dark mb-2">Time Travel (Restore)</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Upload a previous backup (.zip) to temporarily view old data. Live database will be safely paused.
            </p>
            
            {isRestoredMode ? (
              <div className="p-6 bg-warning/10 border-2 border-warning/30 rounded-xl flex flex-col items-center gap-3">
                <h4 className="font-bold text-warning flex items-center gap-2"><AlertTriangle size={18} /> Viewing Old Data</h4>
                <button onClick={handleRevert} disabled={revertLoading} className="bg-warning text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2">
                  {revertLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} Revert to Live DB
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <input type="file" accept=".zip" ref={restoreFileRef} onChange={handleRestore} className="hidden" />
                <button onClick={() => restoreFileRef.current.click()} disabled={restoreLoading} className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 w-full md:w-auto">
                  {restoreLoading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} Upload & View Old Backup
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Picture Tab */}
      {activeTab === 'Profile Picture' && (
        <div className="max-w-2xl bg-white dark:bg-background-dark rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-border-dark animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-border-dark">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl"><ShieldCheck size={28} /></div>
            <div>
              <h3 className="text-xl font-bold text-heading dark:text-heading-dark">Admin Profile</h3>
              <p className="text-sm font-medium text-text-secondary dark:text-text-dark mt-1">Update your profile picture</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-full overflow-hidden border-[4px] border-gray-100 dark:border-border-dark shadow-md bg-gray-50 dark:bg-background-darker">
                <img src={preview} onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff"; }} alt="Preview" className="h-full w-full object-cover" />
              </div>
              <button onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all border-[3px] border-white dark:border-background-dark">
                <Camera size={16} />
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoChange} />
            </div>

            <div className="flex-1 w-full space-y-4">
              <button onClick={handleSavePhoto} disabled={!photo || loading} className="w-full bg-primary text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
          <div className="bg-white dark:bg-background-dark w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-border-dark animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-background-darker">
              <h3 className="text-lg font-bold text-heading dark:text-heading-dark">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-4">
                <div className="h-20 w-20 rounded-full overflow-hidden border-[3px] border-gray-100 dark:border-border-dark shadow-sm bg-gray-50 dark:bg-background-darker relative mb-2">
                  <img src={userPhotoPreview} onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + (formData.username || 'User') + "&background=4f46e5&color=fff"; }} alt="User" className="h-full w-full object-cover" />
                </div>
                <button type="button" onClick={() => userPhotoRef.current?.click()} className="text-xs font-bold text-primary hover:underline flex items-center gap-1"><Camera size={14} /> Upload Photo</button>
                <input type="file" ref={userPhotoRef} hidden accept="image/*" onChange={handleUserPhotoChange} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Username</label>
                <input required type="text" className="w-full p-3 bg-gray-50 dark:bg-background-darker rounded-xl font-bold dark:text-white border border-gray-200 dark:border-border-dark focus:border-primary outline-none" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} disabled={editingUser && editingUser.username === 'admin'} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Password</label>
                <input required type="text" className="w-full p-3 bg-gray-50 dark:bg-background-darker rounded-xl font-bold dark:text-white border border-gray-200 dark:border-border-dark focus:border-primary outline-none" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Role</label>
                <select required className="w-full p-3 bg-gray-50 dark:bg-background-darker rounded-xl font-bold dark:text-white border border-gray-200 dark:border-border-dark focus:border-primary outline-none" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} disabled={editingUser && editingUser.username === 'admin'}>
                  <option value="super_admin">Admin / Principal</option>
                  <option value="exam">Exam Coordinator</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={savingUser} className="w-full bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all flex justify-center items-center gap-2">
                  {savingUser ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {savingUser ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Component
const ColorPickerItem = ({ label, name, value, onChange }) => (
  <div className="bg-gray-50 dark:bg-background-darker p-4 rounded-xl border border-gray-100 dark:border-border-dark flex items-center justify-between">
    <div>
      <p className="text-sm font-bold text-heading dark:text-white">{label}</p>
      <p className="text-[11px] font-medium text-gray-500 uppercase mt-0.5">{value}</p>
    </div>
    <div className="relative h-10 w-10 rounded-lg overflow-hidden shadow-sm border-2 border-white dark:border-border-dark shrink-0">
      <input type="color" value={value} onChange={(e) => onChange(name, e.target.value)} className="absolute -top-4 -left-4 h-20 w-20 cursor-pointer" />
    </div>
  </div>
);
