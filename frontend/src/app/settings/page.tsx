"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings, ShieldAlert, Monitor, Bell, HardDrive, Trash2 } from "lucide-react";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState<'system' | 'dark' | 'light'>('system');
    const [notifications, setNotifications] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("system_token");
            if (!token) {
                router.push("/");
                return;
            }

            try {
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setUser(await res.json());
                } else {
                    router.push("/");
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

    const handleDeleteAccount = async () => {
        if (!user || user.stats.level < 15) return;

        const confirm1 = window.confirm("WARNING: This will permanently erase your player file. All progress will be lost.");
        if (!confirm1) return;

        const confirm2 = prompt("Type 'ERASE' to confirm abandonment of your system progress.");
        if (confirm2 !== 'ERASE') return;

        const token = localStorage.getItem("system_token");
        if (!token) return;

        try {
            const res = await fetch("http://localhost:5000/api/users/me", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                localStorage.removeItem("system_token");
                router.push("/");
            } else {
                const err = await res.json();
                alert(err.error || "Failed to delete account");
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            alert("System override failed.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center py-20 text-system-neon font-caros tracking-[0.2em] animate-pulse">
                INITIALIZING SETTINGS...
            </div>
        );
    }

    if (!user) return null;

    const canDelete = user.stats.level >= 15;

    return (
        <main className="max-w-4xl mx-auto p-6 space-y-12 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-[#011BDE]/30 pb-6 mb-8 mt-4">
                <Settings className="w-10 h-10 text-system-neon" />
                <h1 className="text-4xl font-caros font-black text-white uppercase tracking-wider drop-shadow-[0_0_10px_rgba(17,210,239,0.5)]">
                    System Configuration
                </h1>
            </div>

            {/* Standard Settings Section */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold font-caros tracking-widest text-[#011BDE] flex items-center gap-3">
                    <Monitor className="w-5 h-5" /> Preferences
                </h2>

                <div className="bg-[#02020B] border border-[#011BDE]/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(1,27,222,0.1)] space-y-6">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg text-white font-bold tracking-wide">Interface Theme</h3>
                            <p className="text-sm text-gray-500 mt-1">Adjust the optical parameters of the System UI.</p>
                        </div>
                        <div className="flex bg-black border border-[#011BDE]/50 rounded-lg p-1">
                            {(['light', 'system', 'dark'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`px-4 py-2 rounded-md text-sm font-bold uppercase transition-all ${theme === t
                                            ? "bg-[#011BDE]/30 text-system-neon shadow-[0_0_10px_rgba(1,27,222,0.4)]"
                                            : "text-gray-500 hover:text-gray-300"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#011BDE]/30 to-transparent" />

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg text-white font-bold tracking-wide">System Notifications</h3>
                            <p className="text-sm text-gray-500 mt-1">Receive alerts for completed quests and dynamic penalties.</p>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`w-14 h-7 rounded-full relative transition-colors duration-300 ${notifications ? "bg-system-blue shadow-[0_0_15px_rgba(1,27,222,0.6)]" : "bg-gray-800"
                                }`}
                        >
                            <motion.div
                                animate={{ x: notifications ? 28 : 2 }}
                                className="w-6 h-6 bg-white rounded-full mt-0.5"
                            />
                        </button>
                    </div>
                </div>
            </section>

            {/* Danger Zone: Account Deletion */}
            <section className="space-y-6 pt-12">
                <h2 className="text-xl font-bold font-caros tracking-widest text-red-500 flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5" /> Danger Zone
                </h2>

                <div className={`p-8 rounded-2xl relative overflow-hidden border-2 transition-all duration-500 ${canDelete
                        ? "border-red-600 bg-red-950/20 shadow-[0_0_40px_rgba(220,38,38,0.2)]"
                        : "border-red-900/50 bg-black shadow-[inset_0_0_50px_rgba(220,38,38,0.15)] opacity-80"
                    }`}>
                    {/* Security Lines Pattern BG */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(220,38,38,0.05)_25%,rgba(220,38,38,0.05)_50%,transparent_50%,transparent_75%,rgba(220,38,38,0.05)_75%,rgba(220,38,38,0.05)_100%)] bg-[length:20px_20px] pointer-events-none" />

                    {!canDelete && (
                        <div className="absolute inset-0 z-0 pointer-events-none border-[3px] border-red-600/60 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.8)] opacity-50 animate-pulse" />
                    )}

                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <HardDrive className={`w-6 h-6 ${canDelete ? 'text-red-500' : 'text-red-900'}`} />
                                <h3 className={`text-2xl font-black tracking-widest uppercase ${canDelete ? 'text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]' : 'text-red-800'}`}>
                                    Erase Player Data
                                </h3>
                            </div>
                            <p className="text-gray-400 font-lato leading-relaxed">
                                Permanently delete your System presence. This action cannot be reversed. All stats, items, and shadows will be returned to the void.
                            </p>

                            {!canDelete && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-red-950/40 border border-red-500/50 rounded-lg text-red-500 text-xs font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    UNAUTHORIZED: PLAYER LEVEL TOO LOW. SURVIVE UNTIL LEVEL 15 TO UNLOCK ABANDONMENT.
                                </motion.div>
                            )}
                        </div>

                        <button
                            onClick={handleDeleteAccount}
                            disabled={!canDelete}
                            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 md:w-auto w-full justify-center ${canDelete
                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.8)] scale-100 hover:scale-105"
                                    : "bg-red-950/40 border border-red-900 text-red-900 cursor-not-allowed opacity-60"
                                }`}
                        >
                            <Trash2 className="w-5 h-5" />
                            Purge System
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
