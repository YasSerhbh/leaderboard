/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Leaderboard, Team } from "../../components/leaderboard";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

export default function LiveLeaderboardPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [showLogos, setShowLogos] = useState(true); // default true
    const [isVisible, setIsVisible] = useState(true); // controls animation state
    const [shouldRender, setShouldRender] = useState(true); // controls DOM presence

    // Handle animation end to remove from DOM after slide-out
    const handleAnimationEnd = useCallback(() => {
        if (!isVisible) {
            setShouldRender(false);
        }
    }, [isVisible]);

    // When visibility changes to true, ensure we render before animating
    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
        }
    }, [isVisible]);

    // Keyboard hotkey support - press 'L' to toggle leaderboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle on 'L' key (but not when typing in input fields)
            if (e.key === 'l' || e.key === 'L') {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                    return;
                }
                setIsVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!supabase) return;
        // Initial fetch
        const fetchTeams = async () => {
            const { data, error } = await supabase
                .from("teams")
                .select("id, name, elims, alive_count, logo, show_on_leaderboard")
                .order("id", { ascending: true });
            if (!error && data) {
                setTeams(
                    data.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        elims: t.elims,
                        aliveCount: t.alive_count,
                        logo: t.logo,
                        show_on_leaderboard: t.show_on_leaderboard,
                    }))
                );
            } else {
                setTeams([]);
            }
        };
        // Fetch global settings for leaderboard (including visibility)
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from("settings")
                .select("show_logos, show_leaderboard")
                .single<{ show_logos: boolean; show_leaderboard?: boolean }>();
            console.log("Settings fetch:", { data, error });
            if (!error && data) {
                if (typeof data.show_logos === "boolean") {
                    setShowLogos(data.show_logos);
                }
                if (typeof data.show_leaderboard === "boolean") {
                    setIsVisible(data.show_leaderboard);
                }
            }
        };
        fetchTeams();
        fetchSettings();
        // Subscribe to teams changes
        const teamsChannel = supabase
            .channel("teams-updates")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "teams" },
                (_payload) => {
                    fetchTeams();
                }
            )
            .subscribe();
        // Subscribe to settings changes (for visibility toggle from admin)
        const settingsChannel = supabase
            .channel("settings-updates")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "settings" },
                (_payload) => {
                    fetchSettings();
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(teamsChannel);
            supabase.removeChannel(settingsChannel);
        };
    }, []);

    if (!supabaseUrl || !supabaseKey) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-green-950">
                <div className="text-red-500 font-bold text-lg">Supabase environment variables are missing.</div>
            </main>
        );
    }

    return (
        <main
            className="min-h-screen bg-[#2E2EFF] flex flex-col items-end justify-end"
            style={{ padding: 5 }}
        >
            <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        
        .leaderboard-enter {
          animation: slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .leaderboard-exit {
          animation: slideOutRight 0.35s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
        }
      `}</style>

            {shouldRender && (
                <div
                    className={isVisible ? 'leaderboard-enter' : 'leaderboard-exit'}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <Leaderboard teams={teams} showLogos={showLogos} />
                </div>
            )}
        </main>
    );
}
