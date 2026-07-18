import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Image as ImageIcon, Lock, Save, BookOpen } from 'lucide-react';
import { GlassToast } from '../components/GlassToast';

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

interface ProfileManagerProps {
    role: string;
    onUpdateComplete: (updatedData: any) => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ role, onUpdateComplete }) => {
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Profile Form
    const [fullName, setFullName] = useState("");
    const [profilePic, setProfilePic] = useState("");
    
    // Student specific
    const [classes, setClasses] = useState<any[]>([]);
    const [classId, setClassId] = useState("");
    const [section, setSection] = useState("");

    // Password Form
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`${API_BASE_URL}/profile/me`, config);
                
                setProfileData(res.data);
                setFullName(res.data.full_name || "");
                setProfilePic(res.data.profile_picture_url || "");
                
                if (role === 'student') {
                    setClassId(res.data.school_class_id || "");
                    setSection(res.data.section || "");
                    // Fetch classes for dropdown
                    const classRes = await axios.get(`${API_BASE_URL}/admin/classes`, config);
                    setClasses(classRes.data);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                setToast({ show: true, message: "Failed to load profile", type: "error" });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [role]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const payload: any = {
                full_name: fullName,
                profile_picture_url: profilePic
            };
            
            if (role === 'student') {
                payload.school_class_id = classId ? parseInt(classId) : null;
                payload.section = section;
            }

            const res = await axios.put(`${API_BASE_URL}/profile/update`, payload, config);
            
            setToast({ show: true, message: "Profile updated successfully!", type: "success" });
            onUpdateComplete({ ...profileData, ...payload });
        } catch (error) {
            console.error("Update error:", error);
            setToast({ show: true, message: "Failed to update profile", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setToast({ show: true, message: "New passwords do not match!", type: "error" });
            setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
            return;
        }
        
        setPasswordSaving(true);
        try {
            const token = localStorage.getItem("token");
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            await axios.put(`${API_BASE_URL}/profile/password`, {
                old_password: oldPassword,
                new_password: newPassword
            }, config);
            
            setToast({ show: true, message: "Password updated successfully!", type: "success" });
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Password error:", error);
            const msg = error.response?.data?.detail || "Failed to update password";
            setToast({ show: true, message: msg, type: "error" });
        } finally {
            setPasswordSaving(false);
            setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
        }
    };

    if (loading) return <div className="flex justify-center items-center py-20 text-slate-500">Loading profile...</div>;

    const inputStyle = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium";
    const labelStyle = "block text-xs font-black text-slate-700 uppercase tracking-widest mb-2";

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            {toast.show && <GlassToast message={toast.message} type={toast.type as any} onClose={() => setToast({...toast, show: false})} />}

            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                    <div className="bg-slate-100 p-4 rounded-full text-slate-700">
                        <User size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">General Profile</h2>
                        <p className="text-slate-500 font-medium text-sm">Update your personal details and photo.</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar Preview */}
                        <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center shrink-0">
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-slate-300" />
                                )}
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{role}</span>
                        </div>

                        {/* Form Fields */}
                        <div className="flex-1 w-full space-y-6">
                            <div>
                                <label className={labelStyle}>Full Name</label>
                                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputStyle} />
                            </div>

                            <div>
                                <label className={labelStyle}>Email (Read-only)</label>
                                <input type="email" value={profileData?.email || ""} disabled className={`${inputStyle} bg-slate-50 text-slate-400 cursor-not-allowed`} />
                            </div>

                            <div>
                                <label className={labelStyle}>Profile Picture URL</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ImageIcon size={18} className="text-slate-400" />
                                    </div>
                                    <input type="text" placeholder="https://example.com/photo.jpg" value={profilePic} onChange={(e) => setProfilePic(e.target.value)} className={`${inputStyle} pl-11`} />
                                </div>
                            </div>

                            {role === 'student' && (
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <label className={labelStyle}>Class / Year</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <BookOpen size={18} className="text-slate-400" />
                                            </div>
                                            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={`${inputStyle} pl-11`}>
                                                <option value="">-- Select Class --</option>
                                                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className={labelStyle}>Section</label>
                                        <input type="text" placeholder="e.g. A" value={section} onChange={(e) => setSection(e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2">
                            <Save size={18} />
                            {saving ? "Saving..." : "Save Profile"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Section */}
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                    <div className="bg-slate-100 p-4 rounded-full text-slate-700">
                        <Lock size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Security</h2>
                        <p className="text-slate-500 font-medium text-sm">Update your password to keep your account secure.</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-lg">
                    <div>
                        <label className={labelStyle}>Current Password</label>
                        <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className={inputStyle} />
                    </div>
                    <div>
                        <label className={labelStyle}>New Password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className={inputStyle} />
                    </div>
                    <div>
                        <label className={labelStyle}>Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className={inputStyle} />
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={passwordSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-emerald-900/20 transition-all">
                            {passwordSaving ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
