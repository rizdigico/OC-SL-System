"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PenaltyZone } from "@/components/PenaltyZone";

export default function PenaltyPage() {
    const router = useRouter();

    useEffect(() => {
        const checkPenaltyStatus = async () => {
            const token = localStorage.getItem("system_token");
            if (!token) {
                // Remove cookie if no token just in case
                document.cookie = "isPenalized=false; path=/";
                router.push("/");
                return;
            }

            try {
                const res = await fetch("http://localhost:5000/api/users/me/penalty-status", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.isPenalized === false) {
                        // Penalty lifted
                        document.cookie = "isPenalized=false; path=/";
                        router.push("/dashboard");
                    } else {
                        // Keep penalty
                        document.cookie = "isPenalized=true; path=/";
                    }
                }
            } catch (error) {
                console.error("Failed to check penalty status:", error);
            }
        };

        checkPenaltyStatus();
        const interval = setInterval(checkPenaltyStatus, 30000);
        return () => clearInterval(interval);
    }, [router]);

    return (
        <main className="min-h-screen w-full bg-black">
            <PenaltyZone />
            {/* The penalty zone is fixed and covers everything, but wrapping it in main ensures no layout navs */}
        </main>
    );
}
