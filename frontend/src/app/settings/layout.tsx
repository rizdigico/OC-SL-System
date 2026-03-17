import React from 'react';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-system-black font-lato">
            <nav className="border-b border-[#011BDE]/30 bg-[#011BDE]/5 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/dashboard" className="text-[#011BDE] font-caros font-bold tracking-widest hover:text-system-neon transition-colors uppercase">
                        &larr; Return to Dashboard
                    </Link>
                    <span className="text-gray-400 text-sm font-bold tracking-[0.2em] uppercase">System Settings</span>
                </div>
            </nav>
            {children}
        </div>
    );
}
