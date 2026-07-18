import React from "react";
import { ProfileManager } from "./components/ProfileManager";

const AdminSettings = () => {
    return (
        <div className="w-full max-w-4xl mx-auto py-8">
            <div className="mb-8 px-4">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Settings</h1>
                <p className="text-slate-500 font-medium mt-1">Manage your administrator profile and security credentials.</p>
            </div>
            <ProfileManager role="admin" onUpdateComplete={(data) => {
                // The layout will auto-update if we refresh, or we can just let the user see the toast.
                window.location.reload();
            }} />
        </div>
    );
};

export default AdminSettings;
